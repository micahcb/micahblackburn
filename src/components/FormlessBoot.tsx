"use client";

import { useEffect } from "react";
import { FormlessFluidExact, type FluidExactOptions } from "@/lib/formlessFluidExact";

type Registry = Map<string, FormlessFluidExact>;

declare global {
  interface Window {
    animateContainer?: (id: string, allowCursor?: boolean, options?: Partial<FluidExactOptions>) => void;
    __formlessRegistry?: Registry;
  }
}

const LOG = "[FormlessBoot]";

export default function FormlessBoot() {
  useEffect(() => {
    console.log(LOG, "effect ran, registering animateContainer");
    if (!window.__formlessRegistry) window.__formlessRegistry = new Map();

    window.animateContainer = (id: string, allowCursor = true, options: Partial<FluidExactOptions> = {}) => {
      const key = id || "__body__";
      const target = id ? document.getElementById(id) : document.body;
      console.log(LOG, "animateContainer called", { id, key, targetFound: !!target });
      if (!target) {
        console.warn(LOG, "target element not found for id:", id);
        return;
      }
      const rect = target.getBoundingClientRect();
      console.log(LOG, "target dimensions", { width: rect.width, height: rect.height, tagName: target.tagName });

      const existing = window.__formlessRegistry!.get(key);
      if (existing) {
        console.log(LOG, "destroying existing engine for", key);
        existing.destroy();
        window.__formlessRegistry!.delete(key);
      }

      console.log(LOG, "creating FormlessFluidExact for", key);
      try {
        const engine = new FormlessFluidExact(target, allowCursor, {
          resolution: 0.25,
          cursor_size: 100,
          mouse_force: 3,
          iterations_poisson: 16,
          dt: 1 / 60,
          fluidDecay: 0.99,
          BFECC: true,
          enableBlur: true,
          blur_scale: 1.0,
          colorScale: 2.0,
          useFullColor: false,
          ...options,
        });
        window.__formlessRegistry!.set(key, engine);
        console.log(LOG, "engine created and registered for", key);
      } catch (err) {
        console.error(LOG, "FormlessFluidExact constructor failed", err);
      }
    };

    return () => {
      console.log(LOG, "cleanup: destroying all engines");
      if (window.__formlessRegistry) {
        window.__formlessRegistry.forEach((v) => v.destroy());
        window.__formlessRegistry.clear();
      }
      delete window.animateContainer;
    };
  }, []);

  return null;
}
