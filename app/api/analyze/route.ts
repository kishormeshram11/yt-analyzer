import { NextRequest, NextResponse } from "next/server";

const API = "https://www.googleapis.com/youtube/v3";

function videoId(url: string) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0];
    }

    if (u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }

    const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
    if (shorts) return shorts[1];

    const embed = u.pathname.match(/\/embed\/([^/]+)/);
    if (embed) return embed[1];
  } catch {}

  return null;
}

function channelId(url: string) {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/channel\/([^/]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function handle(url: string) {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/@([^/]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function yt(
  endpoint: string,
  params: Record<string, string>
) {
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    throw new Error("YouTube API key is not configured.");
  }

  const q = new URLSearchParams({
    ...params,
    key,
  });

  const response = await fetch(
    `${API}/${endpoint}?${q.toString()}`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "YouTube API request failed."
    );
  }

  return data;
}

/*
  Read publicly exposed player data from a YouTube watch page.

  IMPORTANT:
  This does NOT claim official YPP status.
  It only looks for publicly exposed ad-break information.
*/
async function readAdSignal(id: string) {
  try {
    const response = await fetch(
      `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!response.ok) {
      return {
        detected: false,
        adBreaks: 0,
        error: `YouTube page returned ${response.status}`,
      };
    }

    const html = await response.text();

    /*
      YouTube can expose player data in several places.
      We search the page for ad-break related structures.
    */

    const adBreakMatches =
      html.match(/adBreaks/g) || [];

    const adPlacementMatches =
      html.match(/adPlacements/g) || [];

    const playerAdMatches =
      html.match(/playerAds/g) || [];

    const totalMatches =
      adBreakMatches.length +
      adPlacementMatches.length +
      playerAdMatches.length;

    /*
      Try to estimate the number of actual ad-break
      objects without treating it as official status.
    */

    const timeRanges =
      html.match(/startTimeMs/g) || [];

    const detected = totalMatches > 0;

    return {
      detected,
      adBreaks: Math.max(
        timeRanges.length,
        adBreakMatches.length
      ),
      rawSignalCount: totalMatches,
    };
  } catch (error: any) {
    return {
      detected: false,
      adBreaks: 0,
      error:
        error?.message ||
        "Unable to read public YouTube page.",
    };
  }
}

async function getVideo(id: string) {
  const data = await yt("videos", {
    part: "snippet,statistics,contentDetails",
    id,
  });

  if (!data.items?.length) {
    throw new Error("Video not found.");
  }

  const v = data.items[0];

  const signal = await readAdSignal(id);

  return {
    id: v.id,
    title: v.snippet?.title || "",
    description: v.snippet?.description || "",
    thumbnail:
      v.snippet?.thumbnails?.high?.url ||
      v.snippet?.thumbnails?.medium?.url ||
      v.snippet?.thumbnails?.default?.url ||
      "",
    publishedAt:
      v.snippet?.publishedAt || "",
    views:
      v.statistics?.viewCount || "0",
    likes:
      v.statistics?.likeCount || "0",
    comments:
      v.statistics?.commentCount || "0",
    channelId:
      v.snippet?.channelId || "",
    channelTitle:
      v.snippet?.channelTitle || "",

    adSignal: signal,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const url = String(
      body?.url || ""
    ).trim();

    if (!url) {
      return NextResponse.json(
        {
          error:
            "YouTube URL is required.",
        },
        { status: 400 }
      );
    }

    /*
      ------------------------------------------------
      VIDEO
      ------------------------------------------------
    */

    const vid = videoId(url);

    if (vid) {
      const video = await getVideo(vid);

      return NextResponse.json({
        type: "video",

        data: {
          video,

          /*
            Descriptive signal only.
          */
          monetizationSignal:
            video.adSignal.detected
              ? "Ad signal detected"
              : "No ad signal detected",

          evidence: {
            adBreaks:
              video.adSignal.adBreaks,
            rawSignalCount:
              video.adSignal.rawSignalCount || 0,
          },
        },
      });
    }

    /*
      ------------------------------------------------
      CHANNEL
      ------------------------------------------------
    */

    let id = channelId(url);

    if (!id) {
      const h = handle(url);

      if (h) {
        const data = await yt(
          "channels",
          {
            part:
              "snippet,statistics,contentDetails",
            forHandle: h,
          }
        );

        id =
          data.items?.[0]?.id ||
          null;
      }
    }

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid YouTube channel URL."
        },
        { status: 400 }
      );
    }

    const channelData = await yt(
      "channels",
      {
        part:
          "snippet,statistics,contentDetails",
        id,
      }
    );

    if (!channelData.items?.length) {
      return NextResponse.json(
        {
          error: "Channel not found."
        },
        { status: 404 }
      );
    }

    const channel =
      channelData.items[0];

    /*
      Get recent uploads.
    */

    const search = await yt(
      "search",
      {
        part: "snippet",
        channelId: id,
        maxResults: "8",
        order: "date",
        type: "video",
      }
    );

    const ids =
      search.items
        ?.map(
          (item: any) =>
            item.id?.videoId
        )
        .filter(Boolean) || [];

    /*
      Fetch videos one-by-one so each video page
      can be inspected for its public ad signal.
    */

    const latestVideos = [];

    for (const id of ids) {
      const video = await getVideo(id);
      latestVideos.push(video);
    }

    const videosWithSignals =
      latestVideos.filter(
        (video: any) =>
          video.adSignal?.detected
      ).length;

    const videosWithoutSignals =
      latestVideos.length -
      videosWithSignals;

    return NextResponse.json({
      type: "channel",

      data: {
        channel: {
          id: channel.id,

          title:
            channel.snippet?.title || "",

          description:
            channel.snippet?.description || "",

          thumbnail:
            channel.snippet?.thumbnails
              ?.high?.url ||
            channel.snippet?.thumbnails
              ?.medium?.url ||
            channel.snippet?.thumbnails
              ?.default?.url ||
            "",

          publishedAt:
            channel.snippet?.publishedAt ||
            "",

          subscribers:
            channel.statistics
              ?.subscriberCount || "0",

          views:
            channel.statistics
              ?.viewCount || "0",

          videoCount:
            channel.statistics
              ?.videoCount || "0",
        },

        latestVideos,

        /*
          Descriptive public evidence.
        */

        publicAdEvidence: {
          videosChecked:
            latestVideos.length,

          videosWithAdSignals:
            videosWithSignals,

          videosWithoutAdSignals:
            videosWithoutSignals,

          signalDetected:
            videosWithSignals > 0,
        },

        /*
          IMPORTANT:
          This is evidence, not official YPP status.
        */

        monetizationSignal:
          videosWithSignals > 0
            ? "Monetization signals detected"
            : "No monetization signals detected",
      },
    });
  } catch (error: any) {
    console.error(
      "Analyzer error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong."
      },
      { status: 500 }
    );
  }
}
