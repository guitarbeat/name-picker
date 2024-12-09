/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false,
  },
  images: {
    remotePatterns: [],
  },
  webpack: (config, { isServer }) => {
    // Asset handling
    config.module.rules.push({
      test: /\.(gif|GIF|mp4)$/i,
      type: "asset/resource",
    });

    // Polyfills and fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Server-side optimization
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: false,
      };
    }

    // Ensure proper module resolution
    config.resolve.extensions = [
      '.js', '.jsx', '.ts', '.tsx', '.json'
    ];

    return config;
  },
  // Ensure proper transpilation
  transpilePackages: [],
  reactStrictMode: true,
};

export default nextConfig;
