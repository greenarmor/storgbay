import path from 'node:path';
import { fileURLToPath } from 'node:url';

const storageEndpoint = process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT;

// Derived entirely from the environment: no hostname is hardcoded, so the same build works
// for any deployment. A malformed endpoint degrades to "no remote pattern" instead of
// crashing the build.
function parseStoragePattern(endpoint) {
  if (!endpoint) return null;
  try {
    const url = new URL(endpoint);
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      pathname: `${url.pathname.replace(/\/$/, '')}/**`,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    console.warn(`[next.config] Ignoring unparseable storage endpoint: ${endpoint}`);
    return null;
  }
}

const storagePattern = parseStoragePattern(storageEndpoint);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const resolveShim = (relativePath) => path.join(currentDir, relativePath);

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: http: https:",
      "font-src 'self'",
      "connect-src 'self' http: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/**' },
      ...(storagePattern ? [storagePattern] : []),
    ],
  },
  turbopack: {
    resolveAlias: {
      encoding: resolveShim('src/lib/shims/encoding.ts'),
      fs: resolveShim('src/lib/shims/fs.ts'),
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      encoding: resolveShim('src/lib/shims/encoding.ts'),
      fs: resolveShim('src/lib/shims/fs.ts'),
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      encoding: resolveShim('src/lib/shims/encoding.ts'),
      fs: resolveShim('src/lib/shims/fs.ts'),
    };
    return config;
  },
};
export default nextConfig;
