import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // _ref/ is a read-only reference copy; never compiled.
  outputFileTracingExcludes: { "*": ["_ref/**"] },
  // /api/firmware reads the ESP32 sketch at runtime.
  outputFileTracingIncludes: { "/api/firmware": ["hardware/esp32_servo_wifi/*.ino"] },
  // pdf-parse bundles an old pdf.js that must run as plain Node code.
  serverExternalPackages: ["pdf-parse"],
  // "/" is the scroll landing (app/page.tsx); Click to Start goes to /lab.
};

export default nextConfig;
