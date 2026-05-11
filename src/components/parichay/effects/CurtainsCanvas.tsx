"use client";

import { useEffect, useRef } from "react";
import { Curtains } from "curtainsjs";

export function CurtainsCanvas() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const curtainsRef = useRef<Curtains | null>(null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Check WebGL support
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      // WebGL not supported — shaders will fallback to static images
      return;
    }

    const curtains = new Curtains({
      container: container,
      alpha: true,
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    });

    curtainsRef.current = curtains;

    curtains.onError(() => {
      console.warn("Curtains.js WebGL error — falling back to static images");
    });

    return () => {
      curtains.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasContainerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
