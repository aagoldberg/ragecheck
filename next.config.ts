import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["linkedom", "@mozilla/readability"],
  async redirects() {
    return [
      {
        source: "/clear",
        destination: "/clearview",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
