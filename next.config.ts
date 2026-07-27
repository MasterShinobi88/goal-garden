import type { NextConfig } from "next";

/**
 * - Browser / Netlify / Vercel: default Next output (Node server or platform adapter)
 * - Electron desktop: set NEXT_OUTPUT=standalone so the packaged server is self-contained
 */
const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? { output: "standalone" as const }
    : {}),
};

export default nextConfig;
