import type { NextConfig } from "next";

// Same port the backend listens on (PORT in .env, 8080 by default)
const backendPort = process.env.BACKEND_PORT || "8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/ai/:path*",
        destination: "http://ai-service:8000/:path*",
      },
      {
        source: "/api/:path*",
        destination: `http://backend:${backendPort}/:path*`,
      },
    ];
  },
};

export default nextConfig;