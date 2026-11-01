import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  // GitHub Pages serves this site from a subfolder.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
};

export default config;
