const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    gzipSize: true,
    craCompat: true,
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for node_modules
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
          },
          // Common chunk for shared components
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
          // Heavy libraries chunk
          heavy: {
            name: 'heavy-libs',
            test: /[\\/]node_modules[\\/](react-icons|jspdf|html2canvas|xlsx|puppeteer-core|@sparticuz\/chromium)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
        },
      };
    }
    return config;
  },
  
  async rewrites() {
    return [
      {
        source: '/robots.txt',
        destination: '/robots.txt',
      },
      {
        source: '/sitemap.xml',
        destination: '/sitemap.xml',
      },
    ];
  },
  // i18n: {
  //   locales: ['az', 'ru', 'en', 'zh', 'de'],
  //   defaultLocale: 'az',
  // },
};

module.exports = withBundleAnalyzer(nextConfig); 