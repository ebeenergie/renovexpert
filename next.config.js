/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  async redirects() {
    return [
      { source: '/parametres', destination: '/settings', permanent: false },
    ]
  },
}

module.exports = nextConfig
