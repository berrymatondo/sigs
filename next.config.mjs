/** @type {import('next').NextConfig} */
const nextConfig = {
  // The v0 preview renders the app inside a cross-origin iframe served from a
  // per-session *.vusercontent.net host. Without allowing these origins, Next.js
  // dev blocks its own client/HMR resources, the page never hydrates, and the
  // sign-in form falls back to a native submit — breaking client-side login.
  allowedDevOrigins: ["*.vusercontent.net", "**.vusercontent.net"],
  // Emits a self-contained .next/standalone server with only the
  // node_modules actually reachable from the app — this is what keeps the
  // Docker image small instead of shipping the full node_modules tree.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
