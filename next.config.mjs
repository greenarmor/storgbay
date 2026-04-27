import path from 'node:path';
import { fileURLToPath } from 'node:url';

const storage = process.env.S3_ENDPOINT ? new URL(process.env.S3_ENDPOINT) : null;

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

/** @type {import('next').NextConfig} */
const nextConfig = {
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
