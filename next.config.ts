import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  reactCompiler: true,
  experimental: {
    // Dynamic pages await the backend on the server; keep their payload in the client router cache
    // for a short while so going back to /events or /characters is instant instead of a full reload.
    staleTimes: { dynamic: 30 },
  },
  turbopack: {},
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "three",
        "@react-three/fiber",
        "@react-three/drei",
        "canvas",
      ];
    }
    return config;
  },
};

export default nextConfig;
