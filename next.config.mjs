/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce OneDrive-related cache rename issues on Windows during dev
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
  // Ensure filesystem-backed tenant data is included in serverless output tracing on Vercel.
  // Without this, `fs.readFile(process.cwd()/data/tenants/...)` may work locally but return null in production.
  outputFileTracingIncludes: {
    '*': ['./data/tenants/**'],
  },
};
export default nextConfig;
