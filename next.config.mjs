/** @type {import('next').NextConfig} */
const nextConfig = {
  // The v0 preview renders the app inside a cross-origin iframe served from a
  // per-session *.vusercontent.net host. Without allowing these origins, Next.js
  // dev blocks its own client/HMR resources, the page never hydrates, and the
  // sign-in form falls back to a native submit — breaking client-side login.
  allowedDevOrigins: ["*.vusercontent.net", "**.vusercontent.net"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
