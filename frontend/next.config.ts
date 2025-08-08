import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  images: {
    remotePatterns: [
      // 모든 CloudFront 배포
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
      },
      // AWS S3 관련
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
