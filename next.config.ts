import type { NextConfig } from "next";

// We pin the project as the workspace root because the dev's home folder
// happens to contain a `package-lock.json`, which Next.js otherwise picks as
// the root and bloats the standalone output with the full absolute path.
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // Standalone build = self-contained server.js + minimal node_modules.
  // Required for the small Docker image we ship to the VPS.
  output: "standalone",
  outputFileTracingRoot: projectRoot,

  reactStrictMode: true,

  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
