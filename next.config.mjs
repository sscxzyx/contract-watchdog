/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdf-parse pulls in canvas as an optional dep — alias it away
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
