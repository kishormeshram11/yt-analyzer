"use client";

import { FormEvent, useState } from "react";

type AdSignal = {
  detected?: boolean;
  adBreaks?: number;
  rawSignalCount?: number;
  error?: string;
};

type Video = {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  publishedAt?: string;
  views?: string;
  likes?: string;
  comments?: string;
  channelId?: string;
  channelTitle?: string;
  adSignal?: AdSignal;
};

type Channel = {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  publishedAt?: string;
  subscribers?: string;
  views?: string;
  videoCount?: string;
};

type Result = {
  type: "video" | "channel";
  data: {
    video?: Video;
    channel?: Channel;
    latestVideos?: Video[];
    monetizationSignal?: string;
    publicAdEvidence?: {
      videosChecked: number;
      videosWithAdSignals: number;
      videosWithoutAdSignals: number;
      signalDetected: boolean;
    };
  };
};

function formatNumber(value?: string) {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) return value || "0";
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;

  return n.toLocaleString();
}

function formatDate(value?: string) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function signalLabel(video: Video) {
  if (video.adSignal?.detected) {
    return "Ad signal detected";
  }

  return "No ad signal detected";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function analyze(e: FormEvent) {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a YouTube video or channel URL.");
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
        throw new Error(data?.error || "Unable to analyze this URL.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#030718] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-white/10 bg-[#030718]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="text-2xl font-bold">
            <span className="text-red-500">YT</span>{" "}
            <span>Analyzer</span>
          </div>

          <div className="hidden gap-8 text-sm text-gray-300 md:flex">
            <a href="#analyzer" className="hover:text-white">
              Analyzer
            </a>
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#how" className="hover:text-white">
              How It Works
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
          </div>

          <button className="rounded-xl border border-white/20 px-4 py-2 text-xl md:hidden">
            ☰
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-5 pb-16 pt-16 text-center md:pt-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 inline-block rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            YouTube Channel & Video Analyzer
          </div>

          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Analyze Any{" "}
            <span className="text-red-500">YouTube</span> Channel
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
            Get public channel statistics, latest uploads and publicly
            detectable ad-related signals in seconds.
          </p>
        </div>
      </section>

      {/* ANALYZER */}
      <section id="analyzer" className="px-5 pb-20">
        <div className="mx-auto max-w-4xl">
          <form
            onSubmit={analyze}
            className="rounded-3xl border border-white/10 bg-[#0c1428] p-5 shadow-2xl md:p-7"
          >
            <label className="mb-3 block text-left text-sm font-medium text-gray-300">
              YouTube Video or Channel URL
            </label>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/@channel"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#050a19] px-5 py-4 text-white outline-none placeholder:text-gray-600 focus:border-red-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-red-600 px-7 py-4 font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* RESULTS */}
      {result && (
        <section className="px-5 pb-20">
          <div className="mx-auto max-w-6xl">
            {/* VIDEO RESULT */}
            {result.type === "video" && result.data.video && (
              <VideoResult video={result.data.video} />
            )}

            {/* CHANNEL RESULT */}
            {result.type === "channel" && result.data.channel && (
              <ChannelResult
                channel={result.data.channel}
                latestVideos={result.data.latestVideos || []}
                evidence={result.data.publicAdEvidence}
              />
            )}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section id="features" className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Powerful YouTube Analysis
            </h2>
            <p className="mt-3 text-gray-400">
              Useful public information in one simple dashboard.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Feature
              icon="📊"
              title="Channel Statistics"
              text="View subscribers, total views and video count."
            />

            <Feature
              icon="🎬"
              title="Latest Uploads"
              text="See the latest videos published by a channel."
            />

            <Feature
              icon="📢"
              title="Ad Signals"
              text="Check publicly detectable ad-related signals on videos."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-white/10 bg-[#070d20] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How It Works
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <Step
              number="01"
              title="Paste URL"
              text="Enter a YouTube video or channel URL."
            />
            <Step
              number="02"
              title="Analyze"
              text="YT Analyzer fetches publicly available YouTube data."
            />
            <Step
              number="03"
              title="View Results"
              text="See channel statistics, videos and available ad signals."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <Faq
              q="What can YT Analyzer check?"
              a="It can show public YouTube channel statistics, latest uploads and publicly detectable ad-related signals."
            />

            <Faq
              q="Does this show official YouTube Partner Program status?"
              a="No. Public YouTube data does not provide a reliable official YPP monetization-status field. Ad signals should therefore be treated only as signals, not as proof of YPP status."
            />

            <Faq
              q="Is my YouTube account required?"
              a="No. You only need a public YouTube video or channel URL."
            />

            <Faq
              q="Why can an ad signal sometimes be unavailable?"
              a="YouTube can change the information exposed on public pages, and ad delivery can vary by viewer, location, device and other factors."
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} YT Analyzer. Built for public YouTube
        analysis.
      </footer>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function VideoResult({ video }: { video: Video }) {
  const detected = Boolean(video.adSignal?.detected);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d162b]">
        <div className="grid md:grid-cols-2">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full min-h-[230px] w-full object-cover"
          />

          <div className="p-6 md:p-8">
            <p className="mb-3 text-sm text-red-400">VIDEO ANALYSIS</p>

            <h2 className="text-2xl font-bold">{video.title}</h2>

            <p className="mt-3 text-sm text-gray-400">
              {video.channelTitle}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat label="Views" value={formatNumber(video.views)} />
              <Stat label="Likes" value={formatNumber(video.likes)} />
              <Stat label="Comments" value={formatNumber(video.comments)} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0d162b] p-6">
        <p className="mb-4 text-lg font-medium text-gray-400">
          Public Ad Signal
        </p>

        <div
          className={`rounded-2xl border p-6 ${
            detected
              ? "border-green-500/40 bg-green-500/10"
              : "border-yellow-500/40 bg-yellow-500/10"
          }`}
        >
          <div className="text-2xl font-bold">
            {detected ? "🟢 Ad signal detected" : "🟡 No ad signal detected"}
          </div>

          <p className="mt-2 text-sm text-gray-400">
            This is a publicly detectable signal only. It does not confirm
            official YouTube Partner Program monetization status.
          </p>

          {video.adSignal?.adBreaks !== undefined && (
            <p className="mt-4 text-sm text-gray-300">
              Detected ad-break signals:{" "}
              <strong>{video.adSignal.adBreaks}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelResult({
  channel,
  latestVideos,
  evidence,
}: {
  channel: Channel;
  latestVideos: Video[];
  evidence?: {
    videosChecked: number;
    videosWithAdSignals: number;
    videosWithoutAdSignals: number;
    signalDetected: boolean;
  };
}) {
  const signalDetected = Boolean(evidence?.signalDetected);

  return (
    <div className="space-y-6">
      {/* CHANNEL HEADER */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d162b] p-6 md:p-8">
        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
          <img
            src={channel.thumbnail}
            alt={channel.title}
            className="h-28 w-28 rounded-full border-4 border-white/10 object-cover"
          />

          <div className="flex-1">
            <p className="text-sm text-red-400">CHANNEL ANALYSIS</p>

            <h2 className="mt-2 text-3xl font-bold">{channel.title}</h2>

            <p className="mt-2 text-sm text-gray-400">
              Created {formatDate(channel.publishedAt)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat
            label="Subscribers"
            value={formatNumber(channel.subscribers)}
          />

          <Stat label="Total Views" value={formatNumber(channel.views)} />

          <Stat label="Videos" value={formatNumber(channel.videoCount)} />
        </div>
      </div>

      {/* CHANNEL AD SIGNAL */}
      <div className="rounded-3xl border border-white/10 bg-[#0d162b] p-6 md:p-8">
        <p className="text-lg text-gray-400">Channel Public Ad Signals</p>

        <div
          className={`mt-5 rounded-2xl border p-6 ${
            signalDetected
              ? "border-green-500/40 bg-green-500/10"
              : "border-yellow-500/40 bg-yellow-500/10"
          }`}
        >
          <div className="text-2xl font-bold">
            {signalDetected
              ? "🟢 Ad signals detected"
              : "🟡 No ad signals detected"}
          </div>

          <p className="mt-2 text-sm text-gray-400">
            This result is based on publicly detectable signals from the
            checked videos. It is not an official YPP monetization-status
            confirmation.
          </p>

          {evidence && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MiniStat
                label="Checked"
                value={String(evidence.videosChecked)}
              />

              <MiniStat
                label="Signals"
                value={String(evidence.videosWithAdSignals)}
              />

              <MiniStat
                label="No Signal"
                value={String(evidence.videosWithoutAdSignals)}
              />
            </div>
          )}
        </div>
      </div>

      {/* LATEST VIDEOS */}
      <div className="rounded-3xl border border-white/10 bg-[#0d162b] p-6 md:p-8">
        <h2 className="mb-7 text-3xl font-bold">Latest Uploads</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {latestVideos.map((video) => (
            <div
              key={video.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#070d20]"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="aspect-video w-full object-cover"
              />

              <div className="p-5">
                <h3 className="line-clamp-2 text-lg font-bold">
                  {video.title}
                </h3>

                <p className="mt-3 text-sm text-gray-400">
                  {formatNumber(video.views)} views
                  {video.publishedAt
                    ? ` • ${formatDate(video.publishedAt)}`
                    : ""}
                </p>

                <div
                  className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                    video.adSignal?.detected
                      ? "bg-green-500/10 text-green-300"
                      : "bg-yellow-500/10 text-yellow-300"
                  }`}
                >
                  {video.adSignal?.detected
                    ? "🟢 Ad signal detected"
                    : "🟡 No ad signal detected"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {latestVideos.length === 0 && (
          <p className="text-gray-400">No recent videos found.</p>
        )}
      </div>
    </div>
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
    <div className="rounded-2xl border border-white/10 bg-[#0c1428] p-7">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-3 leading-7 text-gray-400">{text}</p>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1428] p-7">
      <div className="text-4xl font-black text-red-500">{number}</div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-3 leading-7 text-gray-400">{text}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-2xl border border-white/10 bg-[#0c1428] p-5">
      <summary className="cursor-pointer font-semibold">{q}</summary>
      <p className="mt-4 leading-7 text-gray-400">{a}</p>
    </details>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#050a19] p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/20 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
      }
