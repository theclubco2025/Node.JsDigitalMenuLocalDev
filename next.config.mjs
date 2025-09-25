/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce OneDrive-related cache rename issues on Windows during dev
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
};
export default nextConfig;
