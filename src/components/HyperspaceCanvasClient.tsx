"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR crash — Three.js uses browser WebGL APIs
const HyperspaceCanvas = dynamic(
  () => import("@/components/HyperspaceCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#060d1f] to-black" />
    ),
  }
);

export default HyperspaceCanvas;
