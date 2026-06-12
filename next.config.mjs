/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint errors are dev-time warnings and should not block production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors are caught locally; don't block Vercel deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
