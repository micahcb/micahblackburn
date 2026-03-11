"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

function useIsTouchLike() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(hover: none)");
    setTouch(m.matches || "ontouchstart" in window);
  }, []);
  return touch;
}

type Props = {
  id: string;
  className?: string;
  containerClassName?: string;
  children?: React.ReactNode;
  gradientTop?: number;
  gradientBottom?: number;
};

export default function FormlessAnimatedContainer({
  id,
  className,
  containerClassName,
  children,
  gradientTop = 25,
  gradientBottom = 25,
}: Props) {
  const initialized = useRef(false);
  const [tick, setTick] = useState(0);
  const isTouch = useIsTouchLike();

  useEffect(() => {
    const fn = window.animateContainer;
    console.log("[FormlessAnimatedContainer] effect", { id, tick, hasAnimateContainer: !!fn, initialized: initialized.current });
    if (initialized.current) return;
    if (fn) {
      const el = document.getElementById(id);
      console.log("[FormlessAnimatedContainer] calling animateContainer", { id, allowCursor: !isTouch, divInDom: !!el });
      fn(id, !isTouch);
      initialized.current = true;
    } else {
      console.log("[FormlessAnimatedContainer] animateContainer not ready, retry in 100ms");
      const t = setTimeout(() => setTick((x) => x + 1), 100);
      return () => clearTimeout(t);
    }
  }, [id, isTouch, tick]);

  return (
    <div className={clsx("relative w-full", containerClassName)}>
      <div className={clsx("absolute left-0 top-0 z-[-1] w-screen", className)}>
        <div id={id} className="s-full h-full w-full" />
        {gradientBottom !== undefined && (
          <div
            className="s-full absolute left-0 top-0 h-full w-full"
            style={{
              background: `linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) ${gradientBottom}%)`,
            }}
          />
        )}
        {gradientTop !== undefined && (
          <div
            className="s-full absolute left-0 top-0 h-full w-full"
            style={{
              background: `linear-gradient(0deg, rgba(0,0,0,0) ${100 - gradientTop}%, rgba(0,0,0,1) 100%)`,
            }}
          />
        )}
      </div>
      {children}
    </div>
  );
}
