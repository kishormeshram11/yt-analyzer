"use client";

import { useState } from "react";

type Result = {
  type: "channel" | "video";
  data: any;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);

  async function analyze() {
    if (!url.trim()) {
      setError("Please enter a YouTube channel or video URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function formatNumber(value: any) {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#" className="text-xl font-bold">
            YT <span className="text-red-500">Analyzer</span>
          </a>

          <nav className="hidden gap-6 text-sm md:flex">
            <a href="#home" className="hover:text-red-400">Home</a>
            <a href="#features" className="hover:text-red-400">Features</a>
            <a href="#how" className="hover:text-red-400">How It Works</a>
            <a href="#faq" className="hover:text-red-400">FAQ</a>
            <a href="#contact" className="hover:text-red-400">Contact</a>
          </nav>

          <button
            onClick={() => setMenu(!menu)}
            className="rounded-lg border border-slate-700 px-3 py-2 md:hidden"
          >
            ☰
          </button>
        </div>

        {menu && (
          <nav className="border-t border-slate-800 px-5 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#home" onClick={() => setMenu(false)}>Home</a>
              <a href="#features" onClick={() => setMenu(false)}>Features</a>
              <a href="#how" onClick={() => setMenu(false)}>How It Works</a>
              <a href="#faq" onClick={() => setMenu(false)}>FAQ</a>
              <a href="#contact" onClick={() => setMenu(false)}>Contact</a>
            </div>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="px-5 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 inline-block rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            YouTube Channel & Video Analytics
          </div>

          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
            Analyze YouTube
            <span className="block text-red-500">Like a Pro</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Get public YouTube statistics, video performance and channel
            information in seconds.
          </p>

          {/* ANALYZER */}
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") analyze();
                }}
                placeholder="Paste YouTube channel or video URL"
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 outline-none focus:border-red-500"
              />

              <button
                onClick={analyze}
                disabled={loading}
                className="rounded-xl bg-red-600 px-7 py-4 font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze Now"}
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-red-400">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      {result && (
        <section className="px-5 pb-20">
          <div className="mx-auto max-w-5xl">
            {result.type === "channel" ? (
              <ChannelResult data={result.data} formatNumber={formatNumber} />
            ) : (
              <VideoResult data={result.data} formatNumber={formatNumber} />
            )}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section id="features" className="border-t border-slate-900 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">
            Powerful <span className="text-red-500">Features</span>
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Feature
              icon="📊"
              title="Channel Analytics"
              text="View subscribers, total views and video count."
            />
            <Feature
              icon="🎬"
              title="Video Analytics"
              text="Check views, likes, comments and video details."
            />
            <Feature
              icon="⚡"
              title="Fast Analysis"
              text="Get public YouTube information quickly."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-slate-900 px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Step n="1" title="Copy URL" text="Copy a YouTube channel or video URL." />
            <Step n="2" title="Paste URL" text="Paste it into the analyzer above." />
            <Step n="3" title="View Results" text="See available public statistics instantly." />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold">FAQ</h2>

          <div className="mt-8 space-y-4">
            <details className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <summary className="cursor-pointer font-semibold">
                What can YT Analyzer analyze?
              </summary>
              <p className="mt-3 text-slate-400">
                Public information from YouTube channels and videos.
              </p>
            </details>

            <details className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <summary className="cursor-pointer font-semibold">
                Is my YouTube account required?
              </summary>
              <p className="mt-3 text-slate-400">
                No. You only need a public YouTube URL.
              </p>
            </details>

            <details className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <summary className="cursor-pointer font-semibold">
                Does it show private information?
              </summary>
              <p className="mt-3 text-slate-400">
                No. The analyzer is designed to use publicly available data.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-slate-900 px-5 py-20 text-center">
        <h2 className="text-3xl font-bold">Contact Us</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Have feedback or suggestions? We would love to hear from you.
        </p>
        <p className="mt-5 text-red-400">
          Contact details will be added here.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 px-5 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} YT Analyzer. All rights reserved.</p>
        <p className="mt-2">
          This website uses publicly available YouTube data.
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-slate-400">{text}</p>
    </div>
  );
}

function Step({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-xl font-bold">
        {n}
      </div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-slate-400">{text}</p>
    </div>
  );
}

function ChannelResult({
  data,
  formatNumber,
}: {
  data: any;
  formatNumber: (n: any) => string;
}) {
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
            <p className="mt-2 text-slate-400">
              {channel.description || "No description available."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Subscribers" value={formatNumber(channel.subscribers)} />
          <Stat label="Total Views" value={formatNumber(channel.views)} />
          <Stat label="Videos" value={formatNumber(channel.videoCount)} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-2xl font-bold">Latest Uploads</h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {videos.map((video: any) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 hover:border-red-500"
            >
              {video.thumbnail && (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="aspect-video w-full object-cover"
                />
              )}

              <div className="p-4">
                <h4 className="font-semibold">{video.title}</h4>
                <p className="mt-2 text-sm text-slate-500">
                  {formatNumber(video.views)} views
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoResult({
  data,
  formatNumber,
}: {
  data: any;
  formatNumber: (n: any) => string;
}) {
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

      <h2 className="mt-6 text-2xl font-bold">{video.title}</h2>

      <p className="mt-2 text-slate-400">
        Channel: {video.channelTitle}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Views" value={formatNumber(video.views)} />
        <Stat label="Likes" value={formatNumber(video.likes)} />
        <Stat label="Comments" value={formatNumber(video.comments)} />
      </div>

      <div className="mt-6 rounded-xl bg-slate-950 p-5">
        <h3 className="font-bold">Description</h3>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">
          {video.description || "No description available."}
        </p>
      </div>
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
