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
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
