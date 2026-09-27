import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://www.googleapis.com/youtube/v3";

function getVideoId(url: string) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1);
    }

    if (u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }

    const match = u.pathname.match(/\/shorts\/([^/]+)/);
    if (match) return match[1];

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

    const channelMatch = u.pathname.match(/\/channel\/([^/]+)/);
    if (channelMatch) {
      return channelMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

function getHandle(url: string) {
  try {
    const u = new URL(url);

    const match = u.pathname.match(/\/@([^/]+)/);
    if (match) {
      return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

async function youtubeRequest(
  endpoint: string,
  params: Record<string, string>
) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YouTube API key is not configured.");
  }

  const searchParams = new URLSearchParams({
    ...params,
    key: apiKey,
  });

  const response = await fetch(
    `${API_BASE}/${endpoint}?${searchParams.toString()}`,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = String(body?.url || "").trim();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required." },
        { status: 400 }
      );
    }

    const videoId = getVideoId(url);

    // -----------------------------
    // VIDEO ANALYSIS
    // -----------------------------
    if (videoId) {
      const data = await youtubeRequest("videos", {
        part: "snippet,statistics,contentDetails",
        id: videoId,
      });

      if (!data.items?.length) {
        return NextResponse.json(
          { error: "Video not found." },
          { status: 404 }
        );
      }

      const item = data.items[0];

      return NextResponse.json({
        type: "video",
        data: {
          video: {
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
          },
        },
      });
    }

    // -----------------------------
    // CHANNEL ANALYSIS
    // -----------------------------
    let channelId = getChannelId(url);

    // Handle URL such as:
    // https://www.youtube.com/@example
    if (!channelId) {
      const handle = getHandle(url);

      if (handle) {
        const handleData = await youtubeRequest("channels", {
          part: "snippet,statistics",
          forHandle: handle,
        });

        channelId = handleData.items?.[0]?.id || null;
      }
    }

    if (!channelId) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid YouTube channel URL (/channel/...) or handle URL (/@...).",
        },
        { status: 400 }
      );
    }

    const channelData = await youtubeRequest("channels", {
      part: "snippet,statistics",
      id: channelId,
    });

    if (!channelData.items?.length) {
      return NextResponse.json(
        { error: "Channel not found." },
        { status: 404 }
      );
    }

    const channel = channelData.items[0];

    // Get latest public videos
    const searchData = await youtubeRequest("search", {
      part: "snippet",
      channelId,
      maxResults: "12",
      order: "date",
      type: "video",
    });

    const videoIds =
      searchData.items
        ?.map((item: any) => item.id?.videoId)
        .filter(Boolean)
        .join(",") || "";

    let latestVideos: any[] = [];

    if (videoIds) {
      const videosData = await youtubeRequest("videos", {
        part: "snippet,statistics",
        id: videoIds,
      });

      latestVideos = (videosData.items || []).map((item: any) => ({
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
      }));
    }

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
            channel.snippet?.thumbnails?.default?.url ||
            "",
          publishedAt: channel.snippet?.publishedAt || "",
          subscribers: channel.statistics?.subscriberCount || "0",
          views: channel.statistics?.viewCount || "0",
          videoCount: channel.statistics?.videoCount || "0",
        },
        latestVideos,
      },
    });
  } catch (error: any) {
    console.error("YouTube analyzer error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while analyzing the YouTube URL.",
      },
      { status: 500 }
    );
  }
}
