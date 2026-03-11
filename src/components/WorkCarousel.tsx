"use client";

import { useState, useCallback } from "react";
import clsx from "clsx";

export type WorkItem = {
  id: string;
  title: string;
  description: string;
};

const EXAMPLE_WORK: WorkItem[] = [
  {
    id: "1",
    title: "Project Alpha",
    description:
      "A comprehensive platform that helps teams collaborate in real time. Built with a modern stack and a focus on performance and accessibility.",
  },
  {
    id: "2",
    title: "Design System",
    description:
      "Component library and design tokens used across multiple products. Ensures visual and interaction consistency and speeds up development.",
  },
  {
    id: "3",
    title: "Mobile App",
    description:
      "Native-feel mobile experience for ordering and tracking. Shipped to iOS and Android with shared business logic and platform-specific UI.",
  },
  {
    id: "4",
    title: "Data Dashboard",
    description:
      "Real-time analytics and reporting for internal teams. Custom visualizations and export options built on a flexible data pipeline.",
  },
  {
    id: "5",
    title: "E-commerce Redesign",
    description:
      "End-to-end redesign of checkout and product discovery. Improved conversion and reduced cart abandonment with clearer UX.",
  },
];

function PlaceholderIcon() {
  return (
    <div
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
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
    ? EXAMPLE_WORK.find((w) => w.id === expandedId)
    : null;
  const shouldPause = isHovering || expandedId !== null;

  return (
    <section id="work" className="mt-32 pt-16 border-t border-border/40">
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
            {[...EXAMPLE_WORK, ...EXAMPLE_WORK].map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={clsx(
                  "group flex shrink-0 flex-col items-center gap-3 rounded-lg p-4 transition-colors",
                  "hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  expandedId === item.id && "bg-muted/70"
                )}
              >
                <PlaceholderIcon />
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
          className="mt-8 rounded-lg border border-border/40 bg-muted/30 p-6 animate-in fade-in slide-in-from-top-2 duration-200"
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
