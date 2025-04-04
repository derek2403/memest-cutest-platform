/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add configuration to disable SWC binary download for incompatible platforms
  swcMinify: true,
  // Add webpack configuration to handle dynamic imports
  webpack: (config, { isServer }) => {
    // This will ignore the critical dependency warning
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
