"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

let elementDefined = false;

async function ensureElementDefined() {
  if (elementDefined) return;
  const { defineElement } = await import("@lordicon/element");
  defineElement();
  elementDefined = true;
}

export interface LordIconProps {
  src: string;
  trigger?: string;
  target?: string;
  size?: number;
  colors?: string;
  className?: string;
}

export function LordIcon({
  src,
  trigger = "hover",
  target,
  size = 24,
  colors,
  className,
}: LordIconProps) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    ensureElementDefined().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <span
        style={{ width: size, height: size }}
        className={cn("shrink-0 inline-block", className)}
        aria-hidden
      />
    );
  }

  return React.createElement("lord-icon", {
    src,
    trigger,
    target,
    colors,
    style: { width: size, height: size },
    className: cn("shrink-0 current-color", className),
    "aria-hidden": "true",
  });
}
