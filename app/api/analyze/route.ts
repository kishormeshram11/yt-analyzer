import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://www.googleapis.com/youtube/v3";

function videoId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/shorts\/([^/]+)/);
    if (m) return m[1];
    const e = u.pathname.match(/\/embed\/([^/]+)/);
    if (e) return e[1];
  } catch {}
  return null;
}

function channelId(url: string) {
  try {
    const m = new URL(url).pathname.match(/\/channel\/([^/]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function handle(url: string) {
  try {
    const m = new URL(url).pathname.match(/\/@([^/]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function yt(endpoint: string, params: Record<string, string>) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube API key is not configured.");

  const q = new URLSearchParams({ ...params, key });
  const r = await fetch(`${API_BASE}/${endpoint}?${q}`, {
    cache: "no-store",
  });
  const data = await r.json();

  if (!r.ok) throw new Error(data?.error?.message || "YouTube API request failed.");
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = String(body?.url || "").trim();

    if (!url)
      return NextResponse.json({ error: "YouTube URL is required." }, { status: 400 });

    const vid = videoId(url);

    if (vid) {
      const data = await yt("videos", {
        part: "snippet,statistics,contentDetails",
        id: vid,
      });

      if (!data.items?.length)
        return NextResponse.json({ error: "Video not found." }, { status: 404 });

      const x = data.items[0];

      return NextResponse.json({
        type: "video",
        data: {
          video: {
            id: x.id,
            title: x.snippet?.title || "",
            description: x.snippet?.description || "",
            thumbnail:
              x.snippet?.thumbnails?.high?.url ||
              x.snippet?.thumbnails?.medium?.url ||
              x.snippet?.thumbnails?.default?.url || "",
            publishedAt: x.snippet?.publishedAt || "",
            views: x.statistics?.viewCount || "0",
            likes: x.statistics?.likeCount || "0",
            comments: x.statistics?.commentCount || "0",
            channelId: x.snippet?.channelId || "",
            channelTitle: x.snippet?.channelTitle || "",
          },
        },
      });
    }

    let cid = channelId(url);
    const h = handle(url);

    if (!cid && h) {
      const d = await yt("channels", {
        part: "snippet,statistics,status",
        forHandle: `@${h}`,
      });
      cid = d.items?.[0]?.id || null;
    }

    if (!cid)
      return NextResponse.json(
        { error: "Please enter a valid YouTube channel URL (/channel/... or /@...). " },
        { status: 400 }
      );

    const d = await yt("channels", {
      part: "snippet,statistics,status",
      id: cid,
    });

    if (!d.items?.length)
      return NextResponse.json({ error: "Channel not found." }, { status: 404 });

    const c = d.items[0];

    const s = await yt("search", {
      part: "snippet",
      channelId: cid,
      maxResults: "12",
      order: "date",
      type: "video",
    });

    const ids = (s.items || [])
      .map((x: any) => x.id?.videoId)
      .filter(Boolean)
      .join(",");

    let latestVideos: any[] = [];

    if (ids) {
      const v = await yt("videos", {
        part: "snippet,statistics",
        id: ids,
      });

      latestVideos = (v.items || []).map((x: any) => ({
        id: x.id,
        title: x.snippet?.title || "",
        description: x.snippet?.description || "",
        thumbnail:
          x.snippet?.thumbnails?.high?.url ||
          x.snippet?.thumbnails?.medium?.url ||
          x.snippet?.thumbnails?.default?.url || "",
        publishedAt: x.snippet?.publishedAt || "",
        views: x.statistics?.viewCount || "0",
        likes: x.statistics?.likeCount || "0",
        comments: x.statistics?.commentCount || "0",
      }));
    }

    return NextResponse.json({
      type: "channel",
      data: {
        channel: {
          id: c.id,
          title: c.snippet?.title || "",
          description: c.snippet?.description || "",
          thumbnail:
            c.snippet?.thumbnails?.high?.url ||
            c.snippet?.thumbnails?.medium?.url ||
            c.snippet?.thumbnails?.default?.url || "",
          publishedAt: c.snippet?.publishedAt || "",
          subscribers: c.statistics?.subscriberCount || "0",
          views: c.statistics?.viewCount || "0",
          videoCount: c.statistics?.videoCount || "0",
          monetization: "Unknown",
          monetizationReason:
            "YouTube Data API public channel data does not provide exact monetization status.",
        },
        latestVideos,
      },
    });
  } catch (error: any) {
    console.error("YouTube analyzer error:", error);
    return NextResponse.json(
      { error: error?.message || "Something went wrong while analyzing the YouTube URL." },
      { status: 500 }
    );
  }
        }
