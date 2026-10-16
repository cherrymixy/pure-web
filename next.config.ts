import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // _ref/ is a read-only reference copy; never compiled.
  outputFileTracingExcludes: { "*": ["_ref/**"] },
};

export default nextConfig;
