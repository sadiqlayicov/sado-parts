const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle size...\n');

// Check if @next/bundle-analyzer is installed
try {
  require('@next/bundle-analyzer');
} catch (error) {
  console.log('📦 Installing @next/bundle-analyzer...');
  execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
}

// Create temporary next.config.js for bundle analysis
const tempConfig = `
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: true,
  openAnalyzer: false,
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', '@supabase/supabase-js'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  compress: true,
};

module.exports = withBundleAnalyzer(nextConfig);
`;

// Backup original config
const originalConfigPath = path.join(process.cwd(), 'next.config.js');
const backupConfigPath = path.join(process.cwd(), 'next.config.js.backup');

if (fs.existsSync(originalConfigPath)) {
  fs.copyFileSync(originalConfigPath, backupConfigPath);
  console.log('💾 Backed up original next.config.js');
}

// Write temporary config
fs.writeFileSync(originalConfigPath, tempConfig);
console.log('📝 Created temporary next.config.js for analysis');

try {
  // Build with bundle analyzer
  console.log('🏗️  Building with bundle analyzer...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Bundle analysis complete!');
  console.log('📊 Check the generated bundle analysis files:');
  console.log('   - .next/analyze/client.html (Client bundle)');
  console.log('   - .next/analyze/server.html (Server bundle)');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
} finally {
  // Restore original config
  if (fs.existsSync(backupConfigPath)) {
    fs.copyFileSync(backupConfigPath, originalConfigPath);
    fs.unlinkSync(backupConfigPath);
    console.log('🔄 Restored original next.config.js');
  }
}

// Analyze package.json for large dependencies
console.log('\n📦 Analyzing dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

console.log('\n📋 Dependency Analysis:');
console.log('='.repeat(50));

// Check for known large packages
const largePackages = [
  'puppeteer-core',
  '@sparticuz/chromium',
  'html2canvas',
  'jspdf',
  'jspdf-autotable',
  'xlsx',
  'bcryptjs',
  'multer',
  'nodemailer'
];

largePackages.forEach(pkg => {
  if (allDependencies[pkg]) {
    console.log(`⚠️  Large package detected: ${pkg}`);
  }
});

console.log('\n💡 Optimization Recommendations:');
console.log('1. Consider lazy loading for large packages');
console.log('2. Use dynamic imports for heavy libraries');
console.log('3. Implement code splitting for routes');
console.log('4. Optimize images and use WebP format');
console.log('5. Enable gzip compression');
console.log('6. Use CDN for static assets');