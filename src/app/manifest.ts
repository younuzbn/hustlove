import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/**
 * Generates `/manifest.webmanifest` from `siteConfig` — the brand's name and
 * colours, never a generic "App" (the old static `manifest.json` shipped that
 * name on every site cut from this starter). Next links it in `<head>`.
 *
 * The icons in `public/` are generated from `src/assets/brand/mark.svg` by
 * `tools/qa/brand-kit.mjs` (obsidian/frontend/seo-metadata.md → "Brand kit").
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: siteConfig.backgroundColor,
    theme_color: siteConfig.themeColor,
    icons: [
      ...[36, 48, 72, 96, 144, 192].map((size) => ({
        src: `/android-icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
      })),
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
