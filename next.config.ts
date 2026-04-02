import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** Pin app root when multiple lockfiles exist (e.g. parent + cam-clinic folder). */
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
