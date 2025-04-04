/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add configuration to disable SWC binary download for incompatible platforms
  swcMinify: true,
};

export default nextConfig;
