import { NextRequest, NextResponse } from "next/server";

const API = "https://www.googleapis.com/youtube/v3";

async function yt(endpoint: string, params: Record<string, string>) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube API key is not configured.");

  const q = new URLSearchParams({ ...params, key });
  const r = await fetch(`${API}/${endpoint}?${q}`, { cache: "no-store" });
  const d = await r.json();

  if (!r.ok) throw new Error(d?.error?.message || "YouTube API error");
  return d;
}

function getVideo(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    return u.pathname.match(/\/(?:shorts|embed)\/([^/]+)/)?.[1] || null;
  } catch {
    return null;
  }
}

function getChannel(url: string) {
  try {
    const p = new URL(url).pathname;
    return {
      id: p.match(/\/channel\/([^/]+)/)?.[1] || null,
      handle: p.match(/\/@([^/]+)/)?.[1] || null,
    };
  } catch {
    return { id: null, handle: null };
  }
}

async function adSignal(id: string) {
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
      },
      cache: "no-store",
    });

    const html = await r.text();

    const ad =
      html.includes('"yt_ad"') ||
      html.includes('"adPlacements"') ||
      html.includes('"playerAds"');

    return ad;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url)
      return NextResponse.json(
        { error: "YouTube URL is required." },
        { status: 400 }
      );

    const vid = getVideo(url);

    // VIDEO CHECK
    if (vid) {
      const d = await yt("videos", {
        part: "snippet,statistics,contentDetails",
        id: vid,
      });

      if (!d.items?.length)
        return NextResponse.json(
          { error: "Video not found." },
          { status: 404 }
        );

      const v = d.items[0];
      const ads = await adSignal(vid);

      return NextResponse.json({
        type: "video",
        data: {
          video: {
            id: v.id,
            title: v.snippet?.title || "",
            description: v.snippet?.description || "",
            thumbnail:
              v.snippet?.thumbnails?.high?.url ||
              v.snippet?.thumbnails?.medium?.url ||
              "",
            publishedAt: v.snippet?.publishedAt || "",
            views: v.statistics?.viewCount || "0",
            likes: v.statistics?.likeCount || "0",
            comments: v.statistics?.commentCount || "0",
            channelId: v.snippet?.channelId || "",
            channelTitle: v.snippet?.channelTitle || "",
            monetization: ads ? "Monetized" : "Unknown",
            monetizationReason: ads
              ? "Advertising signal detected."
              : "No public advertising signal detected.",
          },
        },
      });
    }

    // CHANNEL CHECK
    const cinfo = getChannel(url);
    let cid = cinfo.id;

    if (!cid && cinfo.handle) {
      const h = await yt("channels", {
        part: "snippet,statistics,status",
        forHandle: `@${cinfo.handle}`,
      });
      cid = h.items?.[0]?.id || null;
    }

    if (!cid)
      return NextResponse.json(
        { error: "Please enter a valid YouTube channel URL." },
        { status: 400 }
      );

    const cd = await yt("channels", {
      part: "snippet,statistics,status",
      id: cid,
    });

    if (!cd.items?.length)
      return NextResponse.json(
        { error: "Channel not found." },
        { status: 404 }
      );

    const channel = cd.items[0];

    const search = await yt("search", {
      part: "snippet",
      channelId: cid,
      maxResults: "10",
      order: "date",
      type: "video",
    });

    const ids = (search.items || [])
      .map((x: any) => x.id?.videoId)
      .filter(Boolean);

    const latestVideos: any[] = [];
    let adCount = 0;

    for (const id of ids) {
      const ads = await adSignal(id);
      if (ads) adCount++;

      const x = search.items.find((i: any) => i.id?.videoId === id);

      latestVideos.push({
        id,
        title: x?.snippet?.title || "",
        description: x?.snippet?.description || "",
        thumbnail:
          x?.snippet?.thumbnails?.high?.url ||
          x?.snippet?.thumbnails?.medium?.url ||
          "",
        publishedAt: x?.snippet?.publishedAt || "",
        adSignal: ads,
      });
    }

    let monetization = "Unknown";

    if (adCount >= 3) monetization = "Monetized";
    else if (ids.length >= 5 && adCount === 0) monetization = "Not Monetized";

    return NextResponse.json({
      type: "channel",
      data: {
        channel: {
          id: channel.id,
          title: channel.snippet?.title || "",
          description: channel.snippet?.description || "",
          thumbnail:
            channel.snippet?.thumbnails?.high?.url ||
            channel.snippet?.thumbnails?.medium?.url ||
            "",
          publishedAt: channel.snippet?.publishedAt || "",
          subscribers: channel.statistics?.subscriberCount || "0",
          views: channel.statistics?.viewCount || "0",
          videoCount: channel.statistics?.videoCount || "0",
          monetization,
          monetizationReason:
            `${adCount} of ${ids.length} recent videos showed an advertising signal.`,
        },
        latestVideos,
      },
    });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { error: e?.message || "Something went wrong." },
      { status: 500 }
    );
  }
          }
