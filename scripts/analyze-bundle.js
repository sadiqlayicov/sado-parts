#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle size...\n');

// Install @next/bundle-analyzer if not already installed
try {
  require('@next/bundle-analyzer');
} catch (error) {
  console.log('Installing @next/bundle-analyzer...');
  execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
}

// Create temporary config for bundle analysis
const tempConfigPath = 'next.config.analyze.js';
const analyzeConfig = `
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: true,
  openAnalyzer: false,
  analyzerMode: 'static',
  analyzerPort: 8888,
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
  logLevel: 'info'
});

module.exports = withBundleAnalyzer({
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['react-icons', '@prisma/client'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
});
`;

fs.writeFileSync(tempConfigPath, analyzeConfig);

try {
  // Run build with bundle analyzer
  console.log('Building with bundle analyzer...');
  execSync('ANALYZE=true npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, NEXT_CONFIG_FILE: tempConfigPath }
  });

  // Read and analyze bundle stats
  if (fs.existsSync('bundle-stats.json')) {
    const stats = JSON.parse(fs.readFileSync('bundle-stats.json', 'utf8'));
    
    console.log('\n📊 Bundle Analysis Results:\n');
    
    // Analyze chunks
    const chunks = stats.chunks || [];
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1}: ${chunk.names.join(', ')}`);
      console.log(`  Size: ${(chunk.size / 1024).toFixed(2)} KB`);
      console.log(`  Modules: ${chunk.modules.length}`);
      console.log('');
    });

    // Analyze modules by size
    const modules = stats.modules || [];
    const largeModules = modules
      .filter(module => module.size > 50 * 1024) // Modules larger than 50KB
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    if (largeModules.length > 0) {
      console.log('🔴 Large Modules (>50KB):\n');
      largeModules.forEach(module => {
        console.log(`${module.name}`);
        console.log(`  Size: ${(module.size / 1024).toFixed(2)} KB`);
        console.log(`  Chunks: ${module.chunks.join(', ')}`);
        console.log('');
      });
    }

    // Analyze packages
    const packages = stats.packages || [];
    const largePackages = packages
      .filter(pkg => pkg.size > 100 * 1024) // Packages larger than 100KB
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    if (largePackages.length > 0) {
      console.log('🔴 Large Packages (>100KB):\n');
      largePackages.forEach(pkg => {
        console.log(`${pkg.name}@${pkg.version}`);
        console.log(`  Size: ${(pkg.size / 1024).toFixed(2)} KB`);
        console.log(`  Chunks: ${pkg.chunks.join(', ')}`);
        console.log('');
      });
    }

    // Generate optimization recommendations
    console.log('💡 Optimization Recommendations:\n');
    
    const recommendations = [];
    
    // Check for large dependencies that could be lazy loaded
    const lazyLoadablePackages = ['puppeteer-core', 'html2canvas', 'jspdf', 'xlsx'];
    largePackages.forEach(pkg => {
      if (lazyLoadablePackages.some(name => pkg.name.includes(name))) {
        recommendations.push(`Consider lazy loading ${pkg.name} using dynamic imports`);
      }
    });

    // Check for duplicate packages
    const packageCounts = {};
    packages.forEach(pkg => {
      const name = pkg.name.split('@')[0];
      packageCounts[name] = (packageCounts[name] || 0) + 1;
    });

    Object.entries(packageCounts)
      .filter(([name, count]) => count > 1)
      .forEach(([name, count]) => {
        recommendations.push(`Multiple versions of ${name} detected (${count} versions)`);
      });

    // Check for unused packages
    const unusedPackages = ['lodash', 'moment', 'date-fns'];
    unusedPackages.forEach(pkg => {
      if (packages.some(p => p.name.includes(pkg))) {
        recommendations.push(`Consider removing unused package: ${pkg}`);
      }
    });

    if (recommendations.length > 0) {
      recommendations.forEach(rec => console.log(`• ${rec}`));
    } else {
      console.log('✅ No major optimization issues found!');
    }

    console.log('\n📁 Bundle analysis files generated:');
    console.log('• bundle-stats.json - Detailed bundle statistics');
    console.log('• .next/analyze/ - HTML reports for visual analysis');
    
  } else {
    console.log('❌ Bundle stats file not found');
  }

} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
} finally {
  // Clean up temporary config
  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
  }
}