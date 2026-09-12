import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // db/queue/email are workspace packages published as plain TS/ESM source
  // (no prebuilt dist required in dev); transpile them through Next's
  // pipeline rather than requiring each to ship its own compiled output.
  transpilePackages: ["@railhead/db", "@railhead/queue", "@railhead/email"],
};

export default nextConfig;
