import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // _ref/ is a read-only reference copy; never compiled.
  outputFileTracingExcludes: { "*": ["_ref/**"] },
  // pdf-parse bundles an old pdf.js that must run as plain Node code.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
