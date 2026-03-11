"use client";

import { useState, useCallback } from "react";
import clsx from "clsx";
import Image from "next/image";

export type WorkItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
  logo?: string;
};

const WORK_ITEMS: WorkItem[] = [
  {
    id: "smartbettor",
    title: "Smartbettor.ai",
    description:
      "Web app for sports betting insights and analysis. Built with a modern stack to help users make data-informed decisions.",
    href: "https://www.smartbettor.ai/",
    logo: "/work_logos/SmartBettor.png",
  },
  {
    id: "oddible",
    title: "Oddible.ai",
    description:
      "React Native mobile app — the companion to Smartbettor.ai. Cross-platform iOS and Android with shared business logic and native-feel UI.",
    href: "https://www.oddible.ai/",
    logo: "/work_logos/Oddible.png",
  },
  {
    id: "sycamore",
    title: "Sycamore",
    description:
      "Personal finance web app and Swift iOS app. Full-stack budgeting and tracking, deployed on Railway with a native iOS client.",
    href: "https://sycamore-production-0924.up.railway.app/",
    logo: "/work_logos/Sycamore.svg",
  },
  {
    id: "charles-schwab",
    title: "Charles Schwab",
    description:
      "Engineering work at Charles Schwab — building and maintaining financial platforms and tooling for advisors and clients.",
    logo: "/work_logos/CharlesSchwab.png",
  },
  {
    id: "sparkbeyond",
    title: "SparkBeyond",
    description:
      "AI and data science platform work — building tools and pipelines that help organizations discover insights from complex data.",
    logo: "/work_logos/SparkBeyond.png",
  },
  {
    id: "nyrr-bot",
    title: "NYRR Discord Bot",
    description:
      "Discord bot that scrapes NYRR race schedules and surfaces volunteer opportunities so users can easily find and sign up for events.",
    logo: "/work_logos/NYRR.png",
  },
];

function PlaceholderIcon() {
  return (
    <div
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-background/80 text-muted-foreground"
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="8" height="8" x="3" y="3" rx="1" />
        <rect width="8" height="8" x="13" y="3" rx="1" />
        <rect width="8" height="8" x="3" y="13" rx="1" />
        <rect width="8" height="8" x="13" y="13" rx="1" />
      </svg>
    </div>
  );
}

export default function WorkCarousel() {
  const [isHovering, setIsHovering] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleItemClick = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const expandedItem = expandedId
    ? WORK_ITEMS.find((w) => w.id === expandedId)
    : null;
  const shouldPause = isHovering || expandedId !== null;

  return (
    <section id="work" className="mt-32 pt-16 border-t border-black">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-8">
        Work
      </h2>

      <div
        className="relative -mx-6 sm:-mx-8"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="overflow-hidden">
          <div
            className="flex gap-10 py-4"
            style={{
              width: "max-content",
              animation: "work-scroll 40s linear infinite",
              animationPlayState: shouldPause ? "paused" : "running",
            }}
          >
            {/* Duplicate set for seamless loop */}
            {[...WORK_ITEMS, ...WORK_ITEMS].map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={clsx(
                  "group flex shrink-0 flex-col items-center gap-3 rounded-lg p-4 transition-colors cursor-pointer bg-secondary/70",
                  "hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  expandedId === item.id && "bg-secondary"
                )}
              >
                {item.logo ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-background/80">
                    <Image
                      src={item.logo}
                      alt=""
                      width={80}
                      height={80}
                      className="object-contain p-2"
                      unoptimized={item.logo.endsWith(".svg")}
                    />
                  </div>
                ) : (
                  <PlaceholderIcon />
                )}
                <span className="text-sm font-medium text-foreground text-center max-w-[100px] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded description */}
      {expandedItem && (
        <div
          className="mt-8 rounded-lg border border-border/50 bg-secondary p-6 animate-in fade-in slide-in-from-top-2 duration-200"
          role="region"
          aria-label={`Description for ${expandedItem.title}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {expandedItem.title}
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {expandedItem.description}
              </p>
              {expandedItem.href && (
                <a
                  href={expandedItem.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
                >
                  Visit site →
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpandedId(null)}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
