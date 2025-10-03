const storage = process.env.S3_ENDPOINT ? new URL(process.env.S3_ENDPOINT) : null;

const storagePathname = `${storage?.pathname?.replace(/\/$/, '') || '/storage'}/**`;

const storagePattern = {
  protocol: storage?.protocol?.replace(':', '') ?? 'https',
  hostname: storage?.hostname ?? 'storgbay.online',
  pathname: storagePathname,
};

if (storage?.port) {
  storagePattern.port = storage.port;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/**' },
      storagePattern,
    ],
  },
};
export default nextConfig;
