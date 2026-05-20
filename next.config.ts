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
  // Acknowledge Turbopack (Next.js 16 default) so the webpack config below
  // doesn't trigger the "webpack config with no turbopack config" warning.
  // Three.js deps work fine under Turbopack without extra externals because
  // FBXCharacterViewer is loaded via `next/dynamic` with `ssr: false`.
  turbopack: {},
  // Three.js / react-three/fiber use browser-only APIs (WebGL, canvas).
  // We must not let webpack try to resolve them on the server bundle.
  // (Only used when running `next dev --webpack` or `next build --webpack`.)
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
