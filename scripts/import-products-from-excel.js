const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const filePath = process.argv[2];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('Fayl tapılmadı! İstifadə: node scripts/import-products-from-excel.js <excel-fayli.xlsx>');
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // 1. Bütün unikal kateqoriyaları topla
  const uniqueCategories = Array.from(new Set(rows.map(row => row.Category).filter(Boolean)));

  // 2. Mövcud kateqoriyaları bir dəfə tap
  const existingCategories = await prisma.category.findMany({ where: { name: { in: uniqueCategories } } });
  const categoryMap = {};
  for (const cat of existingCategories) {
    categoryMap[cat.name] = cat.id;
  }

  // 3. Olmayan kateqoriyaları bir dəfə yarat
  const missingCategories = uniqueCategories.filter(cat => !categoryMap[cat]);
  if (missingCategories.length > 0) {
    const created = await prisma.category.createMany({ data: missingCategories.map(name => ({ name })), skipDuplicates: true });
    // Yenidən fetch et ki, id-lər alınsın
    const allCategories = await prisma.category.findMany({ where: { name: { in: uniqueCategories } } });
    for (const cat of allCategories) {
      categoryMap[cat.name] = cat.id;
    }
  }

  // 4. Məhsulları toplu şəkildə əlavə et
  const productsToInsert = [];
  let processed = 0;
  for (const row of rows) {
    const {
      Name,
      SKU,
      Brand,
      Category,
      Price,
      SalePrice,
      Stock,
      Description
    } = row;
    if (!Name || !SKU || !Category) continue;
    productsToInsert.push({
      name: Name,
      sku: SKU,
      description: Description || '',
      categoryId: categoryMap[Category],
      price: parseFloat(Price) || 0,
      salePrice: SalePrice ? parseFloat(SalePrice) : null,
      stock: parseInt(Stock) || 0,
    });
    processed++;
  }

  if (productsToInsert.length > 0) {
    await prisma.product.createMany({ data: productsToInsert, skipDuplicates: true });
  }
  console.log(`İdxal tamamlandı. ${processed} məhsul əlavə olundu.`);
  await prisma.$disconnect();
}

main(); 