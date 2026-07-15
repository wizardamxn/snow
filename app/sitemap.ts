import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: "https://amanahmad.xyz/", lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: "https://amanahmad.xyz/resume", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
