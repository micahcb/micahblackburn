"use client";

import { useSurpriseFooter } from "./useSurpriseFooter";
import "./surprise-footer.css";

export function SurpriseFooter() {
  useSurpriseFooter();

  return (
    <div id="surpriseFooter" className="surprise-footer" aria-hidden>
      <canvas id="orbCanvas" />
      <div id="orbControls" className="orb-controls" aria-hidden>
        <button
          id="orbShakeBtn"
          type="button"
          className="orb-control-btn"
          title="Shake orbs"
          aria-label="Shake orbs"
        >
          ↻
        </button>
        <button
          id="orbDropBtn"
          type="button"
          className="orb-control-btn"
          title="Drop more orbs"
          aria-label="Drop more orbs"
        >
          +
        </button>
        <button
          id="orbClearBtn"
          type="button"
          className="orb-control-btn"
          title="Clear and refill"
          aria-label="Clear and refill orbs"
        >
          ×
        </button>
      </div>
    </div>
  );
}
