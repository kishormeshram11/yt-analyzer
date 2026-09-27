"use client";

import { useState } from "react";

type AnalysisResult = {
  type: "channel" | "video";
  data: any;
};

function formatNumber(value: string | number) {
  const n = Number(value || 0);

  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;

  return n.toLocaleString("en-IN");
}

function formatDate(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze this URL.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#050816]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/20">
              ▶
            </div>

            <div>
              <h1 className="text-lg font-bold">YT Analyzer</h1>
              <p className="text-xs text-slate-400">
                YouTube Intelligence
              </p>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
            Public Data
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center">
        <div className="mx-auto mb-6 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          ⚡ Fast YouTube Analytics
        </div>

        <h2 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          Analyze Any{" "}
          <span className="text-red-500">YouTube Channel</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          Get public channel statistics, latest uploads and video
          information in seconds.
        </p>

        {/* Search */}
        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") analyze();
              }}
              placeholder="Paste YouTube channel or video URL..."
              className="h-14 flex-1 rounded-2xl border border-white/10 bg-[#080d20] px-5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-500/60"
            />

            <button
              onClick={analyze}
              disabled={loading}
              className="h-14 rounded-2xl bg-red-600 px-8 font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Feature cards */}
        {!result && (
          <div className="mt-14 grid gap-5 text-left md:grid-cols-3">
            <Feature
              icon="📊"
              title="Channel Analytics"
              text="View subscribers, total views and video count."
            />

            <Feature
              icon="🚀"
              title="Latest Uploads"
              text="Explore the latest public videos from a channel."
            />

            <Feature
              icon="🎬"
              title="Video Analysis"
              text="Check views, likes, comments and video details."
            />
          </div>
        )}
      </section>

      {/* Results */}
      {result?.type === "channel" && (
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {result.data.channel.thumbnail && (
                <img
                  src={result.data.channel.thumbnail}
                  alt=""
                  className="h-24 w-24 rounded-full border-4 border-red-500/20 object-cover"
                />
              )}

              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">
                  CHANNEL ANALYSIS
                </p>

                <h3 className="mt-1 text-3xl font-black">
                  {result.data.channel.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                  {result.data.channel.description ||
                    "No public channel description available."}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat
                label="Subscribers"
                value={formatNumber(result.data.channel.subscribers)}
              />

              <Stat
                label="Total Views"
                value={formatNumber(result.data.channel.views)}
              />

              <Stat
                label="Videos"
                value={formatNumber(result.data.channel.videoCount)}
              />
            </div>

            {/* Monetization */}
            <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <h4 className="font-bold text-yellow-300">
                Monetization
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                YouTube monetization status cannot be verified from
                public statistics alone. This analyzer does not claim
                whether a channel is monetized or not.
              </p>
            </div>
          </div>

          {/* Latest uploads */}
          <div className="mt-8">
            <div className="mb-5">
              <p className="text-sm font-medium text-red-400">
                RECENT CONTENT
              </p>
              <h3 className="mt-1 text-3xl font-black">
                Latest Uploads
              </h3>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(result.data.latestVideos || []).map((video: any) => (
                <div
                  key={video.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-red-500/30"
                >
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />

                  <div className="p-5">
                    <h4 className="line-clamp-2 font-bold leading-6">
                      {video.title}
                    </h4>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(video.publishedAt)}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <MiniStat
                        label="Views"
                        value={formatNumber(video.views)}
                      />
                      <MiniStat
                        label="Likes"
                        value={formatNumber(video.likes)}
                      />
                      <MiniStat
                        label="Comments"
                        value={formatNumber(video.comments)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Result */}
      {result?.type === "video" && (
        <section className="mx-auto max-w-5xl px-5 pb-20">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            {result.data.video.thumbnail && (
              <img
                src={result.data.video.thumbnail}
                alt=""
                className="aspect-video w-full object-cover"
              />
            )}

            <div className="p-6 sm:p-8">
              <p className="text-sm font-medium text-red-400">
                VIDEO ANALYSIS
              </p>

              <h3 className="mt-2 text-3xl font-black">
                {result.data.video.title}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {result.data.video.channelTitle}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Views"
                  value={formatNumber(result.data.video.views)}
                />

                <Stat
                  label="Likes"
                  value={formatNumber(result.data.video.likes)}
                />

                <Stat
                  label="Comments"
                  value={formatNumber(result.data.video.comments)}
                />
              </div>

              <div className="mt-8">
                <h4 className="text-xl font-bold">Description</h4>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                  {result.data.video.description ||
                    "No public description available."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 px-5 py-8 text-center">
        <p className="text-sm text-slate-500">
          © 2026 YT Analyzer · Public YouTube data only
        </p>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {text}
      </p>
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
    <div className="rounded-2xl border border-white/10 bg-[#050816] p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 p-2 text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-bold">{value}</p>
    </div>
  );
}
