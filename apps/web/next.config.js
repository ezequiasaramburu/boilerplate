/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@my/ui', '@my/types'],
  experimental: {
    esmExternals: true,
  },
  webpack: (config) => {
    // Handle ES modules from workspace packages
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    return config;
  },
};

export default nextConfig;
