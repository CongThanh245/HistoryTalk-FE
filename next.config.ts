import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      // thêm các domain khác nếu cần sau
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
