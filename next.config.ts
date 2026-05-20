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
  // Three.js / react-three/fiber use browser-only APIs (WebGL, canvas).
  // We must not let webpack try to resolve them on the server bundle.
  webpack(config, { isServer }) {
    if (isServer) {
      // Prevent canvas / webgl deps from breaking server-side compilation
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
