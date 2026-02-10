/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['firebase', '@firebase/auth'],
  webpack: (config, { isServer }) => {
    // Firebase uses undici for server-side fetch.
    // On client-side (browser), undici is not needed because browsers have native fetch.
    // This alias prevents the "private class fields" error with older Node.js versions.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'undici': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
