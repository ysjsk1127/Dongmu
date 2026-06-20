/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  output: 'export',
  basePath: isProd ? '/Dongmu' : '',
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: isProd ? '/Dongmu' : '' },
};

export default nextConfig;
