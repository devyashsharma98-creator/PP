import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pragya Pravah — Bhopal Vibhag",
    short_name: "Pragya Pravah",
    description: "Pragya Pravah institutional ERP — events, approvals, aalekh, and prachar.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf8f5",
    theme_color: "#f97316",
    lang: "en",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
