"use client";

/**
 * Wave-shaped section divider, styled after the uploaded reference image
 * (gray surface above, solid ocean-blue wave below).
 */
export default function WaveDivider({ flip = false }) {
  return (
    <div className={`w-full leading-[0] ${flip ? "rotate-180" : ""}`}>
      <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[90px]">
        <path
          fill="#2B93D1"
          d="M0,72 C120,108 240,36 360,54 C480,72 600,114 720,96 C840,78 960,30 1080,42 C1200,54 1320,102 1440,66 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
}
