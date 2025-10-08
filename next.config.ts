import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Allows Netlify to deploy even if ESLint finds errors
  },
  // You can also add other future config options here
};

export default nextConfig;
