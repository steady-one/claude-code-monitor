import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@claude-code-monitor/shared'],
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
