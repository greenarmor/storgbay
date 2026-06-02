import path from 'node:path';
import { fileURLToPath } from 'node:url';

const storageEndpoint = process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT;
const storage = storageEndpoint ? new URL(storageEndpoint) : null;

const storagePattern = {
  protocol: storage?.protocol?.replace(':', '') ?? 'https',
  hostname: storage?.hostname ?? 'storgbay.online',
  pathname: `${storage?.pathname?.replace(/\/$/, '') || ''}/**`,
};

if (storage?.port) {
  storagePattern.port = storage.port;
}

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
      { protocol: 'https', hostname: 'storgbay.online', pathname: '/**' },
      storagePattern,
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
