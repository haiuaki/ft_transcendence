import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/ai/:path*",
        destination: "http://ai-service:8000/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://backend:8080/:path*",
      },
    ];
  },
};

export default nextConfig;