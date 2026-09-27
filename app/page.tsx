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
  const [menuOpen, setMenuOpen] = useState(false);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a
            href="#home"
            onClick={closeMenu}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 font-bold">
              YT
            </div>
            <span className="text-lg font-bold">YT Analyzer</span>
          </a>

          {/* Desktop Menu */}
          <nav className="hidden items-center gap-7 md:flex">
            <NavLink href="#home">Home</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#about">About</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </nav>

          {/* Mobile Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xl md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="border-t border-slate-800 bg-slate-950 px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              <MobileNavLink href="#home" onClick={closeMenu}>
                Home
              </MobileNavLink>
              <MobileNavLink href="#features" onClick={closeMenu}>
                Features
              </MobileNavLink>
              <MobileNavLink href="#how-it-works" onClick={closeMenu}>
                How It Works
              </MobileNavLink>
              <MobileNavLink href="#about" onClick={closeMenu}>
                About
              </MobileNavLink>
              <MobileNavLink href="#faq" onClick={closeMenu}>
                FAQ
              </MobileNavLink>
              <MobileNavLink href="#contact" onClick={closeMenu}>
                Contact Us
              </MobileNavLink>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="home"
        className="scroll-mt-24 border-b border-slate-900"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300">
              ✦ Simple & Powerful YouTube Analytics
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Analyze YouTube
              <span className="block text-red-500">Channels & Videos</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Get publicly available YouTube statistics, channel information,
              latest uploads and video performance data in one simple place.
            </p>

            <a
              href="#analyzer"
              className="mt-8 inline-flex items-center rounded-xl bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-500"
            >
              Analyze Now →
            </a>
          </div>

          {/* ANALYZER */}
          <div
            id="analyzer"
            className="mx-auto mt-14 max-w-4xl scroll-mt-24"
          >
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6">
              <div className="mb-5 text-center">
                <h2 className="text-xl font-bold sm:text-2xl">
                  YouTube Analyzer
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Paste a public YouTube channel or video URL below.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") analyze();
                  }}
                  placeholder="https://youtube.com/@channel or video URL..."
                  className="min-h-14 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-500 focus:border-red-500"
                />

                <button
                  type="button"
                  onClick={analyze}
                  disabled={loading}
                  className="min-h-14 rounded-xl bg-red-600 px-8 font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>

          {/* RESULTS */}
          {result && (
            <section className="mx-auto mt-10 max-w-5xl">
              {result.type === "channel" ? (
                <ChannelResult data={result.data} />
              ) : (
                <VideoResult data={result.data} />
              )}
            </section>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="scroll-mt-24 border-b border-slate-900"
      >
        <div className="mx-auto max-w-7xl px-5 py-20">
          <SectionHeading
            badge="Features"
            title="Everything you need in one place"
            text="Quickly explore publicly available YouTube information without complicated dashboards."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon="📊"
              title="Channel Analytics"
              text="View public subscriber count, total views, video count and channel information."
            />

            <FeatureCard
              icon="🎬"
              title="Video Analysis"
              text="Inspect public video views, likes, comments, title and description."
            />

            <FeatureCard
              icon="🚀"
              title="Latest Uploads"
              text="Explore recent public videos uploaded by the analyzed channel."
            />

            <FeatureCard
              icon="⚡"
              title="Fast Analysis"
              text="Enter a YouTube URL and get available public information quickly."
            />

            <FeatureCard
              icon="📱"
              title="Mobile Friendly"
              text="Use the analyzer comfortably on phones, tablets and desktop devices."
            />

            <FeatureCard
              icon="🔒"
              title="Server-Side API"
              text="The YouTube API key is kept on the server instead of being exposed in the browser."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-b border-slate-900"
      >
        <div className="mx-auto max-w-7xl px-5 py-20">
          <SectionHeading
            badge="How It Works"
            title="Analyze in three simple steps"
            text="No complicated setup is required for visitors."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <StepCard
              number="01"
              title="Copy a YouTube URL"
              text="Copy the public URL of a YouTube channel or video."
            />

            <StepCard
              number="02"
              title="Paste the URL"
              text="Paste the URL into the analyzer and press Analyze."
            />

            <StepCard
              number="03"
              title="View the Results"
              text="Explore the publicly available statistics and information."
            />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-24 border-b border-slate-900">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <SectionHeading
            badge="About"
            title="Built to make YouTube data easier to explore"
            text="YT Analyzer is a simple web tool designed to present publicly available YouTube information in a clean and easy-to-understand interface."
          />

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-7 text-left">
            <h3 className="text-xl font-bold">What YT Analyzer provides</h3>

            <p className="mt-4 leading-7 text-slate-400">
              The tool uses publicly available YouTube data to display channel
              and video information. It is designed for creators, researchers,
              viewers and anyone who wants a quick overview of a public
              YouTube channel or video.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoItem text="Public channel statistics" />
              <InfoItem text="Public video statistics" />
              <InfoItem text="Recent channel uploads" />
              <InfoItem text="Clean responsive interface" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-b border-slate-900">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <SectionHeading
            badge="FAQ"
            title="Frequently asked questions"
            text="Some common questions about YT Analyzer."
          />

          <div className="mt-10 space-y-4">
            <Faq
              question="What can I analyze?"
              answer="You can analyze supported public YouTube channel URLs, handle URLs and individual public video URLs."
            />

            <Faq
              question="Does this show private YouTube information?"
              answer="No. The analyzer is designed to display publicly available YouTube information."
            />

            <Faq
              question="Can the analyzer confirm monetization?"
              answer="No. YouTube monetization status is not publicly verifiable from these statistics alone, so the analyzer does not claim that a channel is monetized or not monetized."
            />

            <Faq
              question="Is the YouTube API key visible to visitors?"
              answer="The API request is handled by the server-side route. The API key is stored as a server environment variable rather than being placed in the frontend code."
            />

            <Faq
              question="Why might an analysis fail?"
              answer="A URL may be unsupported, the video or channel may not be available, or the YouTube API may temporarily reject a request."
            />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-24">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <SectionHeading
            badge="Contact Us"
            title="Have feedback or suggestions?"
            text="We would love to hear your ideas for improving YT Analyzer."
          />

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 text-2xl">
              ✉️
            </div>

            <h3 className="mt-5 text-2xl font-bold">Get in touch</h3>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              For questions, feedback, feature suggestions or other inquiries,
              please contact the YT Analyzer team using the contact information
              provided by the site owner.
            </p>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">
              Contact details will be added here.
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-sm font-bold">
                  YT
                </div>
                <span className="font-bold">YT Analyzer</span>
              </div>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                A simple tool for exploring publicly available YouTube channel
                and video information.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <a href="#home" className="transition hover:text-white">
                Home
              </a>
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#about" className="transition hover:text-white">
                About
              </a>
              <a href="#faq" className="transition hover:text-white">
                FAQ
              </a>
              <a href="#contact" className="transition hover:text-white">
                Contact
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} YT Analyzer. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* NAVIGATION */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-slate-400 transition hover:text-white"
    >
      {children}
    </a>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
    >
      {children}
    </a>
  );
}

/* SECTION HEADING */

function SectionHeading({
  badge,
  title,
  text,
}: {
  badge: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300">
        {badge}
      </div>

      <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 leading-7 text-slate-400">{text}</p>
    </div>
  );
}

/* FEATURE CARD */

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-slate-700">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-2xl">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

/* STEP CARD */

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
      <div className="text-sm font-bold text-red-500">{number}</div>

      <h3 className="mt-4 text-xl font-bold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-400">{text}</p>
    </div>
  );
}

/* INFO ITEM */

function InfoItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
      <span className="text-green-400">✓</span>
      {text}
    </div>
  );
}

/* FAQ */

function Faq({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <summary className="cursor-pointer list-none font-semibold">
        <div className="flex items-center justify-between gap-4">
          <span>{question}</span>
          <span className="text-slate-500 transition group-open:rotate-45">
            +
          </span>
        </div>
      </summary>

      <p className="mt-4 border-t border-slate-800 pt-4 text-sm leading-7 text-slate-400">
        {answer}
      </p>
    </details>
  );
}

/* CHANNEL RESULT */

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
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
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
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition hover:-translate-y-1 hover:border-slate-600"
                >
                  {video.thumbnail && (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="aspect-video w-full object-cover"
                    />
                  )}

                  <div className="p-4">
                    <h3 className="font-semibold leading-6">
                      {video.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>
                        {video.publishedAt
                          ? new Date(video.publishedAt).toLocaleDateString()
                          : ""}
                      </span>

                      <span>•</span>

                      <span>{formatNumber(video.views)} views</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
}

/* VIDEO RESULT */


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

      <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
        {video.title}
      </h2>

      {video.channelTitle && (
        <p className="mt-2 text-sm text-slate-500">
          {video.channelTitle}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Views" value={formatNumber(video.views)} />
        <Stat label="Likes" value={formatNumber(video.likes)} />
        <Stat label="Comments" value={formatNumber(video.comments)} />
      </div>

      {video.description && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Description</h3>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-400">
            {video.description}
          </p>
        </div>
      )}
    </div>
  );
}

/* STAT */

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

/* NUMBER FORMAT */

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
   
