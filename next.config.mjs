/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: false,
  experimental: {
    ppr: false,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;