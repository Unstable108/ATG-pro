/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Your existing config (e.g., images, env) if any
  async rewrites() {
    return [
      // ATG homepage alias: / -> /atg
      { source: '/', destination: '/atg' },
      // ATG chapters alias: /chapters -> /atg/chapters
      { source: '/chapters', destination: '/atg/chapters' },
      // ATG chapter reader alias: /chapters/:chapter -> /atg/chapters/:chapter
      { source: '/chapters/:path*', destination: '/atg/chapters/:path*' },
    ];
  },
};

module.exports = nextConfig;