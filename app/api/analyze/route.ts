import { NextRequest, NextResponse } from "next/server";

const API = "https://www.googleapis.com/youtube/v3";

function getVideoId(url: string) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }

    const v = u.searchParams.get("v");
    if (v) return v;

    const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
    if (shorts) return shorts[1];

    const embed = u.pathname.match(/\/embed\/([^/]+)/);
    if (embed) return embed[1];

    return null;
  } catch {
    return null;
  }
}

function getChannelId(url: string) {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/channel\/([^/]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function getHandle(url: string) {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/@([^/]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function youtube(
  endpoint: string,
  params: Record<string, string>
) {
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    throw new Error("YouTube API key is not configured.");
  }

  const searchParams = new URLSearchParams({
    ...params,
    key,
  });

  const response = await fetch(
    `${API}/${endpoint}?${searchParams.toString()}`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "YouTube API request failed."
    );
  }

  return data;
}

/*
  IMPORTANT

  This function only looks for publicly exposed ad-related
  information on the YouTube watch page.

  It does NOT determine official YouTube Partner Program
  monetization status.
*/

async function readPublicAdSignal(videoId: string) {
  try {
    const response = await fetch(
      `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
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
        status: "unavailable" as const,
        adBreaks: 0,
        reason: `YouTube returned HTTP ${response.status}.`,
      };
    }

    const html = await response.text();

    /*
      Look for player-response structures that can contain
      public ad-related information.

      We deliberately do not treat the absence of these
      strings as proof that a video has no ads.
    */

    const adBreakMatches =
      html.match(/"adBreaks"\s*:/g) || [];

    const adPlacementMatches =
      html.match(/"adPlacements"\s*:/g) || [];

    const playerAdMatches =
      html.match(/"playerAds"\s*:/g) || [];

    const adBreakCount =
      adBreakMatches.length +
      adPlacementMatches.length +
      playerAdMatches.length;

    if (adBreakCount > 0) {
      return {
        status: "detected" as const,
        adBreaks: adBreakCount,
        reason: "Public ad-related signal detected.",
      };
    }

    return {
      status: "unavailable" as const,
      adBreaks: 0,
      reason:
        "No usable public ad-related signal was exposed by YouTube.",
    };
  } catch (error: any) {
    return {
      status: "unavailable" as const,
      adBreaks: 0,
      reason:
        error?.message ||
        "Unable to read the public YouTube page.",
    };
  }
}

async function getVideo(videoId: string) {
  const data = await youtube("videos", {
    part: "snippet,statistics,contentDetails",
    id: videoId,
  });

  if (!data.items?.length) {
    throw new Error("Video not found.");
  }

  const item = data.items[0];

  const adSignal = await readPublicAdSignal(videoId);

  return {
    id: item.id,
    title: item.snippet?.title || "",
    description: item.snippet?.description || "",
    thumbnail:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      "",
    publishedAt: item.snippet?.publishedAt || "",
    views: item.statistics?.viewCount || "0",
    likes: item.statistics?.likeCount || "0",
    comments: item.statistics?.commentCount || "0",
    channelId: item.snippet?.channelId || "",
    channelTitle: item.snippet?.channelTitle || "",
    adSignal,
  };
}

async function getChannelByHandle(handle: string) {
  const data = await youtube("channels", {
    part: "snippet,statistics,contentDetails",
    forHandle: handle,
  });

  return data.items?.[0] || null;
}

async function getLatestVideos(channelId: string) {
  const search = await youtube("search", {
    part: "snippet",
    channelId,
    maxResults: "8",
    order: "date",
    type: "video",
  });

  const ids =
    search.items
      ?.map((item: any) => item.id?.videoId)
      .filter(Boolean) || [];

  const videos = [];

  /*
    Keep these sequential to reduce the chance of sending
    too many simultaneous requests.
  */
  for (const id of ids) {
    try {
      const video = await getVideo(id);
      videos.push(video);
    } catch (error) {
      console.error(
        `Unable to analyze video ${id}:`,
        error
      );
    }
  }

  return videos;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const url = String(body?.url || "").trim();

    if (!url) {
      return NextResponse.json(
        {
          error:
            "Please enter a YouTube video or channel URL.",
        },
        { status: 400 }
      );
    }

    /*
      -------------------------
      VIDEO
      -------------------------
    */

    const videoId = getVideoId(url);

    if (videoId) {
      const video = await getVideo(videoId);

      return NextResponse.json({
        type: "video",

        data: {
          video,

          publicAdSignal: {
            status: video.adSignal.status,
            adBreaks: video.adSignal.adBreaks,
            reason: video.adSignal.reason,
          },
        },
      });
    }

    /*
      -------------------------
      CHANNEL
      -------------------------
    */

    let channelId = getChannelId(url);

    if (!channelId) {
      const handle = getHandle(url);

      if (handle) {
        const channel = await getChannelByHandle(handle);
        channelId = channel?.id || null;
      }
    }

    if (!channelId) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid YouTube channel URL.",
        },
        { status: 400 }
      );
    }

    const channelData = await youtube("channels", {
      part: "snippet,statistics,contentDetails",
      id: channelId,
    });

    if (!channelData.items?.length) {
      return NextResponse.json(
        {
          error: "Channel not found.",
        },
        { status: 404 }
      );
    }

    const channel = channelData.items[0];

    const latestVideos = await getLatestVideos(channelId);

    const detectedVideos = latestVideos.filter(
      (video: any) =>
        video.adSignal?.status === "detected"
    );

    const unavailableVideos = latestVideos.filter(
      (video: any) =>
        video.adSignal?.status === "unavailable"
    );

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
            channel.snippet?.thumbnails?.high?.url ||
            channel.snippet?.thumbnails?.medium?.url ||
            channel.snippet?.thumbnails?.default?.url ||
            "",

          publishedAt:
            channel.snippet?.publishedAt || "",

          subscribers:
            channel.statistics?.subscriberCount || "0",

          views:
            channel.statistics?.viewCount || "0",

          videoCount:
            channel.statistics?.videoCount || "0",
        },

        latestVideos,

        publicAdEvidence: {
          videosChecked: latestVideos.length,

          videosWithAdSignals:
            detectedVideos.length,

          videosUnavailable:
            unavailableVideos.length,

          signalDetected:
            detectedVideos.length > 0,

          status:
            detectedVideos.length > 0
              ? "detected"
              : "unavailable",
        },
      },
    });
  } catch (error: any) {
    console.error("Analyzer error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while analyzing the URL.",
      },
      { status: 500 }
    );
  }
}
