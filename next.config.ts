import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Neon can drop connections during parallel prerender; retry and serialize.
    staticGenerationRetryCount: 3,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 50,
  },
}

export default nextConfig
