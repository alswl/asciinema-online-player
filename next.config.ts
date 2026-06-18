import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/asciinema-online-player",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
