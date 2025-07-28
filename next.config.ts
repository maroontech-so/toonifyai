
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Enforce a server-side build instead of a static export.
  // This is required to support Server Actions (used by Genkit flows).
  output: undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
