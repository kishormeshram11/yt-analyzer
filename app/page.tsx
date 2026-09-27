"use client";

import { useState } from "react";

type AnalysisResult = {
  type: "channel" | "video";
  data: any;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    if (!url.trim()) {
      setError("Please enter a YouTube channel or video URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="text-center">
          <div className="mb-4 inline-block rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            YouTube Analyzer
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Analyze Any YouTube Channel
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Enter a public YouTube channel or video URL to view available
            public statistics, uploads and performance information.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") analyze();
              }}
              placeholder="Paste YouTube channel or video URL..."
              className="min-h-14 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-500 focus:border-red-500"
            />

            <button
              onClick={analyze}
              disabled={loading}
              className="min-h-14 rounded-xl bg-red-600 px-7 font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {result && (
          <section className="mx-auto mt-10 max-w-5xl">
            {result.type === "channel" ? (
              <ChannelResult data={result.data} />
            ) : (
              <VideoResult data={result.data} />
            )}
          </section>
        )}

        {!result && !loading && (
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            <Feature
              title="Channel Analytics"
              text="View publicly available channel information and statistics."
            />
            <Feature
              title="Latest Uploads"
              text="Explore recent public videos from the analyzed channel."
            />
            <Feature
              title="Video Analysis"
              text="Inspect publicly available information for individual videos."
            />
          </div>
        )}
      </section>
    </main>
  );
}

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function ChannelResult({ data }: { data: any }) {
  const channel = data.channel;
  const videos = data.latestVideos || [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {channel.thumbnail && (
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className="h-24 w-24 rounded-full object-cover"
            />
          )}

          <div>
            <h2 className="text-3xl font-bold">{channel.title}</h2>

            {channel.description && (
              <p className="mt-2 line-clamp-3 text-sm text-slate-400">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Subscribers"
            value={formatNumber(channel.subscribers)}
          />
          <Stat label="Total Views" value={formatNumber(channel.views)} />
          <Stat label="Videos" value={formatNumber(channel.videoCount)} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-bold">Monetization</h2>

        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
          YouTube monetization status is not publicly verifiable from these
          statistics alone. This analyzer does not claim that a channel is
          monetized or not monetized.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-bold">Latest Uploads</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {videos.map((video: any) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition hover:border-slate-600"
            >
              {video.thumbnail && (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="aspect-video w-full object-cover"
                />
              )}

              <div className="p-4">
                <h3 className="font-semibold">{video.title}</h3>

                <p className="mt-2 text-xs text-slate-500">
                  {video.publishedAt
                    ? new Date(video.publishedAt).toLocaleDateString()
                    : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoResult({ data }: { data: any }) {
  const video = data.video;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full rounded-xl object-cover"
        />
      )}

      <h2 className="mt-6 text-3xl font-bold">{video.title}</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Views" value={formatNumber(video.views)} />
        <Stat label="Likes" value={formatNumber(video.likes)} />
        <Stat label="Comments" value={formatNumber(video.comments)} />
      </div>

      {video.description && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
            {video.description}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatNumber(value: any) {
  if (value === undefined || value === null || value === "") {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}
