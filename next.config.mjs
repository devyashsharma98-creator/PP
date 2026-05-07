/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      // Static assets: allow long-term caching
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public pages: allow short-term caching (ISR/CDN friendly)
      {
        source: '/(parichay|vimarsh|library|feed|history|guide|form|vote)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
      // API routes and protected pages: no caching
      {
        source: '/(api|login|dashboard|aalekh|dayitv|prachar|calendar|directory|users|super-admin|setup-profile)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Required for SharedArrayBuffer used by web-llm WebGPU inference
      {
        source: '/(aalekh|dashboard|vimarsh)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

export default nextConfig;
