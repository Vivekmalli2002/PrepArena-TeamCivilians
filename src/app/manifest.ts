import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Team Civilians — APPSC CBT Practice",
    short_name: "Team Civilians",
    description: "Real-exam CBT practice for APPSC Group-2 and AEE aspirants. Works offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef2f7",
    theme_color: "#f36404",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Tests", url: "/tests", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Flashcards", url: "/learn", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
