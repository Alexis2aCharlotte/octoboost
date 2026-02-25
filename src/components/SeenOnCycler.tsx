"use client";

import { useState, useEffect } from "react";

const platforms = [
  { name: "ChatGPT", logo: "/logos/chatgpt.svg", bg: "bg-[#10a37f]", imgClass: "h-7 w-7 sm:h-8 sm:w-8" },
  { name: "Google", logo: "/logos/google.svg", bg: "bg-white/10", imgClass: "h-7 w-7 sm:h-8 sm:w-8" },
  { name: "Claude", logo: "/logos/claude.png", bg: "bg-[#d4a574]/20", imgClass: "h-7 w-7 sm:h-8 sm:w-8" },
  { name: "Perplexity", logo: "/logos/perplexity.webp", bg: "bg-[#20b2aa]/20", imgClass: "h-7 w-7 sm:h-8 sm:w-8" },
  { name: "Dev.to", logo: "/logos/devto.svg", bg: "bg-transparent", imgClass: "h-9 w-9 sm:h-10 sm:w-10" },
  { name: "Medium", logo: "/logos/medium.svg", bg: "bg-white/10", imgClass: "h-7 w-7 sm:h-8 sm:w-8" },
  { name: "Reddit", logo: "/logos/reddit.webp", bg: "bg-transparent", imgClass: "h-9 w-9 sm:h-10 sm:w-10" },
];

export function SeenOnCycler() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % platforms.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const current = platforms[index];

  return (
    <section className="relative z-10 border-y border-border/50 bg-card/30 px-6 py-10 md:py-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted/50">
          Get seen on
        </p>

        <div
          className={`flex items-center gap-3 transition-all duration-400 ${
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${current.bg} sm:h-12 sm:w-12`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.logo}
              alt={current.name}
              className={`object-contain ${current.imgClass}`}
            />
          </div>
          <span className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {current.name}
          </span>
        </div>

        <p className="max-w-md text-sm leading-relaxed text-muted">
          Show up where your ideal customers search for solutions. Our autopilot
          system gets your brand visible across ChatGPT, Google, Claude,
          Perplexity and other platforms.
        </p>
      </div>
    </section>
  );
}
