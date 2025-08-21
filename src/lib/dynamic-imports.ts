// Dynamic import utilities for heavy libraries
// This helps reduce the initial bundle size by loading heavy libraries only when needed

export const dynamicImports = {
  // PDF Generation
  async loadPDFLibraries() {
    const [jsPDF, autoTable] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    return {
      jsPDF: jsPDF.jsPDF,
      autoTable: autoTable.default
    };
  },

  // Excel Processing
  async loadExcelLibrary() {
    const XLSX = await import('xlsx');
    return XLSX;
  },

  // HTML to Canvas
  async loadHtml2Canvas() {
    const html2canvas = await import('html2canvas');
    return html2canvas.default;
  },

  // Email Sending
  async loadNodemailer() {
    const nodemailer = await import('nodemailer');
    return nodemailer.default;
  },

  // File Upload
  async loadMulter() {
    const multer = await import('multer');
    return multer.default;
  },

  // Password Hashing
  async loadBcrypt() {
    const bcrypt = await import('bcryptjs');
    return bcrypt;
  },

  // Puppeteer for PDF generation
  async loadPuppeteer() {
    const puppeteer = await import('puppeteer-core');
    return puppeteer.default;
  }
};

// Cached instances to avoid multiple imports
const cache = new Map<string, any>();

export async function getCachedImport<T>(
  key: string,
  importFn: () => Promise<T>
): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const module = await importFn();
  cache.set(key, module);
  return module;
}

// Usage examples:
// const { jsPDF, autoTable } = await getCachedImport('pdf', dynamicImports.loadPDFLibraries);
// const XLSX = await getCachedImport('excel', dynamicImports.loadExcelLibrary);