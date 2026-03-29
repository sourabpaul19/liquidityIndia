/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "liquiditybars.com",
        pathname: "/canada/backend/assets/upload/**",
      },
      {
        protocol: "https",
        hostname: "dev2024.co.in",
        pathname: "/web/liquidity-backend/assets/upload/**",
      },
    ],
  },
};

module.exports = nextConfig;
