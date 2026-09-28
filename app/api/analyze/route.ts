import { NextRequest, NextResponse } from "next/server";

const API = "https://www.googleapis.com/youtube/v3";

function videoId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const s = u.pathname.match(/\/shorts\/([^/]+)/);
    if (s) return s[1];
    const e = u.pathname.match(/\/embed\/([^/]+)/);
    if (e) return e[1];
  } catch {}
  return null;
}

function channelId(url: string) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/channel\/([^/]+)/);
    return m?.[1] || null;
  } catch {
    return null;
  }
}

function handle(url: string) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/@([^/]+)/);
    return m?.[1] || null;
  } catch {
    return null;
  }
}

async function yt(endpoint: string, params: Record<string, string>) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube API key is not configured.");

  const q = new URLSearchParams({ ...params, key });
  const r = await fetch(`${API}/${endpoint}?${q}`, {
    cache: "no-store",
  });

  const data = await r.json();

  if (!r.ok) {
    throw new Error(data?.error?.message || "YouTube API request failed.");
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = String(body?.url || "").trim();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required." },
        { status: 400 }
      );
    }

    const vid = videoId(url);

    if (vid) {
      const data = await yt("videos", {
        part: "snippet,statistics,contentDetails",
        id: vid,
      });

      if (!data.items?.length) {
        return NextResponse.json(
          { error: "Video not found." },
          { status: 404 }
        );
      }

      const v = data.items[0];

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
              v.snippet?.thumbnails?.default?.url ||
              "",
            publishedAt: v.snippet?.publishedAt || "",
            views: v.statistics?.viewCount || "0",
            likes: v.statistics?.likeCount || "0",
            comments: v.statistics?.commentCount || "0",
            channelId: v.snippet?.channelId || "",
            channelTitle: v.snippet?.channelTitle || "",
          },
        },
      });
    }

    let id = channelId(url);

    if (!id) {
      const h = handle(url);

      if (h) {
        const d = await yt("channels", {
          part: "snippet,statistics,status",
          forHandle: h,
        });

        id = d.items?.[0]?.id || null;
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Please enter a valid YouTube channel URL." },
        { status: 400 }
      );
    }

    const data = await yt("channels", {
      part: "snippet,statistics,status",
      id,
    });

    if (!data.items?.length) {
      return NextResponse.json(
        { error: "Channel not found." },
        { status: 404 }
      );
    }

    const c = data.items[0];
    const raw = c.status?.isChannelMonetizationEnabled;

    console.log("MONETIZATION DEBUG:", {
      channel: c.id,
      title: c.snippet?.title,
      raw,
      status: c.status,
    });

    let monetization = "Unknown";

    if (raw === true) monetization = "Monetized";
    if (raw === false) monetization = "Not Monetized";

    const search = await yt("search", {
      part: "snippet",
      channelId: id,
      maxResults: "12",
      order: "date",
      type: "video",
    });

    const ids =
      search.items
        ?.map((x: any) => x.id?.videoId)
        .filter(Boolean)
        .join(",") || "";

    let latestVideos: any[] = [];

    if (ids) {
      const vd = await yt("videos", {
        part: "snippet,statistics",
        id: ids,
      });

      latestVideos = (vd.items || []).map((v: any) => ({
        id: v.id,
        title: v.snippet?.title || "",
        description: v.snippet?.description || "",
        thumbnail:
          v.snippet?.thumbnails?.high?.url ||
          v.snippet?.thumbnails?.medium?.url ||
          v.snippet?.thumbnails?.default?.url ||
          "",
        publishedAt: v.snippet?.publishedAt || "",
        views: v.statistics?.viewCount || "0",
        likes: v.statistics?.likeCount || "0",
        comments: v.statistics?.commentCount || "0",
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
            c.snippet?.thumbnails?.default?.url ||
            "",
          publishedAt: c.snippet?.publishedAt || "",
          subscribers: c.statistics?.subscriberCount || "0",
          views: c.statistics?.viewCount || "0",
          videoCount: c.statistics?.videoCount || "0",
          monetization,
          monetizationRaw: raw ?? null,
        },
        latestVideos,
      },
    });
  } catch (e: any) {
    console.error("Analyzer error:", e);

    return NextResponse.json(
      { error: e?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
