"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);

  async function analyze() {
    if (!url.trim()) {
      setError("Please enter a YouTube URL.");
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

  const num = (v: any) =>
    new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Number(v || 0));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#home" className="text-xl font-bold">
            <span className="text-red-500">YT</span> Analyzer
          </a>

          <nav className="hidden gap-6 text-sm md:flex">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
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
            <div className="flex flex-col gap-4 text-sm">
              <a href="#home">Home</a>
              <a href="#features">Features</a>
              <a href="#how">How It Works</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Contact</a>
            </div>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="px-5 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm text-red-400">
            YouTube Channel & Video Analyzer
          </p>

          <h1 className="text-4xl font-extrabold sm:text-6xl">
            Analyze YouTube{" "}
            <span className="text-red-500">Like a Pro</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Analyze channels and videos with subscribers, views,
            latest uploads and available monetization information.
          </p>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                placeholder="Paste YouTube channel or video URL..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 outline-none focus:border-red-500"
              />

              <button
                onClick={analyze}
                disabled={loading}
                className="rounded-xl bg-red-600 px-7 py-4 font-bold hover:bg-red-500 disabled:opacity-60"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-left text-sm text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* RESULT */}
      {result && (
        <section className="px-5 pb-20">
          <div className="mx-auto max-w-6xl">
            {result.type === "channel" ? (
              <Channel data={result.data} num={num} />
            ) : (
              <Video data={result.data} num={num} />
            )}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section id="features" className="border-t border-slate-900 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">
            Features
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Card icon="📊" title="Channel Analytics">
              Subscribers, views and video count.
            </Card>

            <Card icon="💰" title="Monetization">
              Shows monetization status when YouTube provides it.
            </Card>

            <Card icon="🎬" title="Latest Videos">
              View recent uploads and their statistics.
            </Card>

            <Card icon="👁️" title="Video Statistics">
              Views, likes and comments.
            </Card>

            <Card icon="⚡" title="Fast Analysis">
              Quickly analyze YouTube URLs.
            </Card>

            <Card icon="📱" title="Mobile Friendly">
              Works on phones and computers.
            </Card>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="bg-slate-900/40 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">
            How It Works
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Step n="1" title="Copy URL" text="Copy a YouTube URL." />
            <Step n="2" title="Paste URL" text="Paste it into the analyzer." />
            <Step n="3" title="Get Results" text="Click Analyze and see the data." />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">
            FAQ
          </h2>

          <div className="mt-8 space-y-4">
            <Faq
              q="What can I analyze?"
              a="You can analyze YouTube channels, handles and individual videos."
            />

            <Faq
              q="Is the data real?"
              a="The analyzer uses information returned by the YouTube Data API."
            />

            <Faq
              q="Why can monetization show Unknown?"
              a="YouTube may not publicly provide monetization status for every channel."
            />

            <Faq
              q="Does Unknown mean Not Monetized?"
              a="No. Unknown simply means the API did not provide the status."
            />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-5 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h2 className="text-3xl font-bold">Contact</h2>

          <p className="mt-4 text-slate-400">
            Have feedback or suggestions?
          </p>

          <a
            href="https://github.com/kishormeshram11/yt-analyzer"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-bold text-black"
          >
            GitHub Repository
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 px-5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} YT Analyzer
      </footer>
    </main>
  );
}

/* CHANNEL */

function Channel({ data, num }: any) {
  const c = data?.channel || {};
  const videos = data?.latestVideos || [];
  const status = c.monetization || "Unknown";

  const statusClass =
    status === "Monetized"
      ? "border-green-500/30 bg-green-500/10 text-green-300"
      : status === "Not Monetized"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

  return (
    <div className="space-y-6">
      {/* CHANNEL */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {c.thumbnail && (
            <img
              src={c.thumbnail}
              className="h-24 w-24 rounded-full object-cover"
              alt=""
            />
          )}

          <div>
            <p className="text-sm text-red-400">YouTube Channel</p>

            <h2 className="text-3xl font-bold">
              {c.title || "Unknown"}
            </h2>

            <p className="mt-2 line-clamp-3 text-sm text-slate-400">
              {c.description || ""}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Subscribers" value={num(c.subscribers)} />
          <Stat label="Total Views" value={num(c.views)} />
          <Stat label="Videos" value={num(c.videoCount)} />
        </div>
      </div>

      {/* MONETIZATION */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">Monetization</p>

        <div className={`mt-4 rounded-xl border p-5 ${statusClass}`}>
          <p className="text-2xl font-bold">
            {status === "Monetized"
              ? "✓ Monetized"
              : status === "Not Monetized"
              ? "✕ Not Monetized"
              : "? Unknown"}
          </p>

          {status === "Unknown" && (
            <p className="mt-2 text-sm">
              YouTube did not provide a publicly available
              monetization status for this channel.
            </p>
          )}
        </div>
      </div>

      {/* LATEST */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-bold">Latest Uploads</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {videos.map((v: any) => (
            <a
              key={v.id}
              href={`https://www.youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-600"
            >
              {v.thumbnail && (
                <img
                  src={v.thumbnail}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              )}

              <div className="p-4">
                <h3 className="line-clamp-2 font-semibold">
                  {v.title}
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  {num(v.views)} views
                  {v.publishedAt &&
                    ` • ${new Date(v.publishedAt).toLocaleDateString("en-IN")}`}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* VIDEO */

function Video({ data, num }: any) {
  const v = data?.video || {};

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-red-400">YouTube Video</p>

      <h2 className="mt-2 text-3xl font-bold">
        {v.title || "Unknown Video"}
      </h2>

      {v.thumbnail && (
        <img
          src={v.thumbnail}
          alt=""
          className="mt-6 aspect-video w-full rounded-xl object-cover"
        />
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Views" value={num(v.views)} />
        <Stat label="Likes" value={num(v.likes)} />
        <Stat label="Comments" value={num(v.comments)} />
      </div>

      <div className="mt-6 rounded-xl bg-slate-950 p-5">
        <p className="text-sm text-slate-400">Channel</p>
        <p className="mt-1 font-bold">{v.channelTitle}</p>
      </div>
    </div>
  );
}

/* SMALL COMPONENTS */

function Stat({ label, value }: any) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Card({ icon, title, children }: any) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {children}
      </p>
    </div>
  );
}

function Step({ n, title, text }: any) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 font-bold">
        {n}
      </div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function Faq({ q, a }: any) {
  return (
    <details className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <summary className="cursor-pointer font-semibold">
        {q}
      </summary>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        {a}
      </p>
    </details>
  );
      }
