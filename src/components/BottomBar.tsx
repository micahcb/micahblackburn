"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import gsap from "gsap";

type MenuItem = { label: string; href: string };

const MENU_ITEMS: MenuItem[] = [
  { label: "Portfolio", href: "#portfolio" },
  { label: "Team", href: "#team" },
  { label: "Thesis", href: "#thesis" },
  { label: "News", href: "#news" },
  { label: "Contact", href: "#contact" },
];

function pad4(n: number) {
  return Math.max(0, Math.floor(n)).toString().padStart(4, "0");
}

export default function BottomBar() {
  const barRef = useRef<HTMLElement | null>(null);

  const backdropRef = useRef<HTMLDivElement | null>(null);
  const radialRef = useRef<HTMLDivElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);
  const burgerTopRef = useRef<SVGPathElement | null>(null);
  const burgerBottomRef = useRef<SVGPathElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const openTl = useRef<gsap.core.Timeline | null>(null);
  const closeTl = useRef<gsap.core.Timeline | null>(null);

  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const touchCapable =
      window.matchMedia("(hover: none)").matches || "ontouchstart" in window;
    setIsTouch(touchCapable);

    const onMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
      if (barRef.current) {
        barRef.current.style.setProperty("--x", String(e.clientX));
        barRef.current.style.setProperty("--y", String(e.clientY));
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const radial = radialRef.current;
    const circle = circleRef.current;
    const top = burgerTopRef.current;
    const bottom = burgerBottomRef.current;
    const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];

    if (!backdrop || !radial || !circle || !top || !bottom || !items.length)
      return;

    gsap.set(backdrop, { autoAlpha: 0, pointerEvents: "none" });
    gsap.set(radial, { autoAlpha: 0, y: 36, scale: 0.96, pointerEvents: "none" });
    gsap.set(items, { autoAlpha: 0, y: 10, scale: 0.95 });

    openTl.current = gsap
      .timeline({ paused: true, defaults: { ease: "power3.out" } })
      .set(backdrop, { pointerEvents: "auto" })
      .set(radial, { pointerEvents: "auto" })
      .to(backdrop, { autoAlpha: 1, duration: 0.25 }, 0)
      .to(
        radial,
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power4.out" },
        0.02
      )
      .to(
        circle,
        {
          scale: 1.03,
          filter: "brightness(1.1)",
          duration: 0.28,
          ease: "power2.out",
        },
        0
      )
      .to(
        items,
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, stagger: 0.045 },
        0.14
      )
      .to(top, { attr: { d: "M7 0l16 4" }, duration: 0.22 }, 0.04)
      .to(bottom, { attr: { d: "M7 4l16 -4" }, duration: 0.22 }, 0.04);

    closeTl.current = gsap
      .timeline({ paused: true, defaults: { ease: "power2.inOut" } })
      .to(
        items,
        { autoAlpha: 0, y: 8, scale: 0.96, duration: 0.2, stagger: 0.02 },
        0
      )
      .to(radial, { autoAlpha: 0, y: 28, scale: 0.97, duration: 0.26 }, 0.08)
      .to(backdrop, { autoAlpha: 0, duration: 0.22 }, 0.1)
      .to(
        circle,
        { scale: 1, filter: "brightness(1)", duration: 0.22 },
        0.06
      )
      .to(top, { attr: { d: "M5 0h20" }, duration: 0.2 }, 0.05)
      .to(bottom, { attr: { d: "M5 4h20" }, duration: 0.2 }, 0.05)
      .set(backdrop, { pointerEvents: "none" })
      .set(radial, { pointerEvents: "none" });

    return () => {
      openTl.current?.kill();
      closeTl.current?.kill();
    };
  }, []);

  useEffect(() => {
    if (!openTl.current || !closeTl.current) return;
    if (menuOpen) {
      closeTl.current.pause(0);
      openTl.current.play(0);
    } else {
      openTl.current.pause(0);
      closeTl.current.play(0);
    }
  }, [menuOpen]);

  const coordText = useMemo(
    () => `X ${pad4(coords.x)} / Y ${pad4(coords.y)}`,
    [coords.x, coords.y]
  );

  const onMenuEnter = () => {
    if (isTouch || menuOpen || !circleRef.current) return;
    gsap.to(circleRef.current, {
      scale: 1.04,
      filter: "brightness(1.08)",
      duration: 0.18,
    });
  };
  const onMenuLeave = () => {
    if (menuOpen || !circleRef.current) return;
    gsap.to(circleRef.current, {
      scale: 1,
      filter: "brightness(1)",
      duration: 0.18,
    });
  };

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[50] bg-black/45 backdrop-blur-[4px]"
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />

      <div
        ref={radialRef}
        className="fixed left-1/2 bottom-0 z-[55] -translate-x-1/2"
        aria-hidden={!menuOpen}
      >
        <div
          className={clsx(
            "relative h-[620px] w-[620px] rounded-full border border-white/15 overflow-hidden",
            "bg-[radial-gradient(53.06%_53.06%_at_75.97%_29.79%,rgba(255,255,255,0.16)_0%,transparent_100%),hsla(0,0%,100%,0.04)]",
            "backdrop-blur-[4px]"
          )}
          style={{
            clipPath: "circle(52% at 50% 100%)",
            WebkitMaskImage:
              "radial-gradient(transparent 0, transparent 14%, black 14.2%)",
            maskImage:
              "radial-gradient(transparent 0, transparent 14%, black 14.2%)",
          }}
        >
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-[8%] rounded-full border border-white/10" />
          <div className="absolute inset-[16%] rounded-full border border-white/10" />

          <ul className="pointer-events-none absolute left-1/2 bottom-[110px] flex -translate-x-1/2 flex-wrap items-center justify-center gap-3">
            {MENU_ITEMS.map((item, i) => (
              <li key={item.label}>
                <div ref={(el) => { itemRefs.current[i] = el; }}>
                  <a
                    href={item.href}
                    className={clsx(
                      "pointer-events-auto inline-flex min-w-[110px] cursor-pointer justify-center rounded-full whitespace-nowrap",
                      "border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-wide text-white",
                      "backdrop-blur-[4px] transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    )}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <header
        ref={barRef}
        className="bottom-bar fixed inset-x-0 bottom-0 z-[60] flex justify-between pointer-events-none"
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-white focus:px-3 focus:py-2 focus:text-black"
        >
          Skip to Content
        </a>

        <div className="absolute bottom-0 left-1/2 z-[2] aspect-[240/45] w-[13.75rem] -translate-x-1/2 text-white md:aspect-[260/55] md:w-[16.25rem]">
          <button
            type="button"
            aria-label={menuOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={menuOpen}
            className={clsx(
              "pointer-events-auto relative block h-full w-full cursor-pointer appearance-none border-0 bg-transparent text-inherit",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            )}
            onClick={() => setMenuOpen((v) => !v)}
            onMouseEnter={onMenuEnter}
            onMouseLeave={onMenuLeave}
            onFocus={onMenuEnter}
            onBlur={onMenuLeave}
          >
            <div
              ref={circleRef}
              className={clsx(
                "absolute left-1/2 top-0 min-h-[22.5rem] min-w-[22.5rem] -translate-x-1/2 rounded-full",
                menuOpen ? "bg-white" : "bg-black"
              )}
            />
            <svg
              viewBox="0 0 30 5"
              className="absolute left-1/2 top-1/2 h-auto w-8 -translate-x-1/2 -translate-y-1/2"
              aria-hidden
            >
              <path
                ref={burgerTopRef}
                d="M5 0h20"
                fill="none"
                stroke={menuOpen ? "var(--bottom-bar-icon,#000)" : "#fff"}
                strokeWidth="1"
                strokeLinecap="round"
              />
              <path
                ref={burgerBottomRef}
                d="M5 4h20"
                fill="none"
                stroke={menuOpen ? "var(--bottom-bar-icon,#000)" : "#fff"}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {!isTouch && (
          <div className="pointer-events-none relative m-[1.125rem] font-mono text-[10px] uppercase leading-[11px] text-white/35">
            {coordText}
          </div>
        )}
      </header>
    </>
  );
}
