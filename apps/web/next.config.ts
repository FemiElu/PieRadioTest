import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@packages/types"],
  typescript: {
    // !! IMPORTANT !!
    // Do NOT allow production builds to successfully complete if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This prevents production builds from succeeding if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  images: {
    loader: 'custom',
    loaderFile: './supabase-image-loader.js',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.aiir.com'
      },
      // Supabase Image Transformation (Rendering)
      {
        protocol: 'https',
        hostname: 'eybfcekeksdcnimfkgkc.supabase.co',
        pathname: '/storage/v1/render/image/public/**',
      },
      // Standard Supabase Storage
      {
        protocol: 'https',
        hostname: 'eybfcekeksdcnimfkgkc.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/render/image/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: '**.mzstatic.com'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      }
    ]
  }
};

export default nextConfig;