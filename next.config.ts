import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "amzn.asia",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
    ],
  },
};

export default nextConfig;
