const nextConfig = {
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

module.exports = nextConfig; 