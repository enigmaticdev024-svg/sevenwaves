import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Self-contained server in `.next/standalone` so the host can run
  // `node server.js` instead of the heavier `next start`.
  output: 'standalone',
  // Serve images as static files. The built-in optimizer is CPU- and
  // memory-heavy on small containers and was causing 503s during navigation.
  images: {
    unoptimized: true,
  },
  experimental: {
    // Neon can drop connections during parallel prerender; retry and serialize.
    staticGenerationRetryCount: 3,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 50,
  },
}

export default nextConfig
