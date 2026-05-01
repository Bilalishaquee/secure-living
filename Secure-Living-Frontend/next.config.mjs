/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Proxy all /api/* calls to the backend so the browser never makes
  // cross-origin requests — no CORS issues in either environment.
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    const backendOrigin = isDev
      ? "http://localhost:4000"
      : "https://secure-living.vercel.app";
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
