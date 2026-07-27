import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Electron packaging (self-contained Node server)
  output: "standalone",
};

export default nextConfig;
