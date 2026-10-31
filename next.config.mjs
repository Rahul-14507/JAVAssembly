/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
      ],
    },
    {
      // Force immutable caching for JavaBox runtime assets so browsers never revalidate over network
      source: '/javabox/:all*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'Cross-Origin-Resource-Policy',
          value: 'cross-origin',
        },
      ],
    },
  ],
};

export default nextConfig;

