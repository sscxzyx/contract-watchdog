/** @type {import('next').NextConfig} */

// Supabase origin is needed in connect-src (auth/db/storage calls) and
// frame-src/img-src (signed contract URLs are rendered from storage).
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin
  } catch {
    return ''
  }
})()

// Content-Security-Policy: defence-in-depth against injected scripts, clickjacking,
// and data exfiltration to attacker-controlled hosts.
// - script/style keep 'unsafe-inline' because Next.js injects inline bootstrap
//   scripts and Tailwind uses inline styles; tighten to nonces later if needed.
// - connect-src is allow-listed to our own origin + Supabase + Vercel telemetry
//   so a successful XSS can't beacon stolen data to an arbitrary domain.
// - frame-ancestors 'none' hard-blocks clickjacking (stronger than X-Frame-Options).
// - object-src 'none' + base-uri 'self' + form-action 'self' close plugin,
//   <base>-hijack, and form-hijack vectors.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
  `frame-src 'self' ${supabaseOrigin}`.trim(),
  `connect-src 'self' ${supabaseOrigin} https://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: csp },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
