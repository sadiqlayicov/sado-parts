const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
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
  // Optimize bundle size by automatically transforming tree-shake-able imports
  modularizeImports: {
    // Transform `import { FaBeer } from 'react-icons/fa'` → `import { FaBeer } from 'react-icons/fa/FaBeer'`
    'react-icons/fa': {
      transform: 'react-icons/fa/{{member}}',
    },
    // Fallback for any other react-icons sets that might be added later
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
  // i18n: {
  //   locales: ['az', 'ru', 'en', 'zh', 'de'],
  //   defaultLocale: 'az',
  // },
};

module.exports = nextConfig; 