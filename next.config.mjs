/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["typeorm", "better-sqlite3"],
  experimental: {},
};

export default nextConfig;
