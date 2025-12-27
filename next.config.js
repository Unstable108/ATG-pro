/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Your existing config (e.g., images, env) if any
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async rewrites() {
    return [
      // ATG homepage alias: / -> /atg
      { source: "/", destination: "/atg" },
      // ATG chapters alias: /chapters -> /atg/chapters
      { source: "/chapters", destination: "/atg/chapters" },
      // ATG chapter reader alias: /chapters/:chapter -> /atg/chapters/:chapter
      { source: "/chapters/:path*", destination: "/atg/chapters/:path*" },
    ];
  },
  async headers() {
    return [
      // Cache all pages/API with ISR-friendly headers (1hr shared cache, revalidate in bg)
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=3600, stale-while-revalidate",
          },
        ],
      },
      // Long cache for JS/CSS bundles (immutable)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Long cache for images/public assets (adjust if you add /public/images)
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
