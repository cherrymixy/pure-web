import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // _ref/ is a read-only reference copy; never compiled.
  outputFileTracingExcludes: { "*": ["_ref/**"] },
  // pdf-parse bundles an old pdf.js that must run as plain Node code.
  serverExternalPackages: ["pdf-parse"],
  // Landing (app/(public)/page.tsx) is skipped: the app opens straight on the Lab home.
  async redirects() {
    return [{ source: "/", destination: "/lab", permanent: false }];
  },
};

export default nextConfig;
