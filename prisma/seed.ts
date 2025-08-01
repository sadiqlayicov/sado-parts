import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin hesabını yarat
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sado-parts.ru' },
    update: {},
    create: {
      email: 'admin@sado-parts.ru',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+994501234567',
      role: 'ADMIN',
      isApproved: true,
      isActive: true
    },
  });

  console.log('Admin user created:', adminUser.email);

  // Test müştəri hesabı yarat
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: await bcrypt.hash('test123', 12),
      firstName: 'Test',
      lastName: 'User',
      phone: '+994507654321',
      role: 'CUSTOMER',
      isApproved: false,
      isActive: true
    },
  });

  console.log('Test user created:', testUser.email);

  // Sample categories
  const categories = [
    { name: 'Engine Parts', description: 'Engine components and spare parts' },
    { name: 'Hydraulic Systems', description: 'Hydraulic pumps, valves, and hoses' },
    { name: 'Electrical Components', description: 'Electrical parts and wiring' },
    { name: 'Brake Systems', description: 'Brake pads, discs, and hydraulic systems' },
    { name: 'Transmission', description: 'Gearboxes and transmission components' },
    { name: 'Filters', description: 'Air, oil, and fuel filters' },
    { name: 'Tires & Wheels', description: 'Tires, rims, and wheel components' },
    { name: 'Body Parts', description: 'Body panels and structural components' }
  ];

  for (const category of categories) {
    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: { name: category.name }
    });
    
    if (!existingCategory) {
      await prisma.category.create({
        data: {
          name: category.name,
          description: category.description,
          isActive: true
        },
      });
      console.log(`Category ${category.name} created`);
    } else {
      console.log(`Category ${category.name} already exists, skipping`);
    }
  }

  console.log('Categories created');

  // Get created categories for product creation
  const createdCategories = await prisma.category.findMany();

  // Sample products
  const products = [
    {
      name: 'Engine Oil Filter',
      description: 'High-quality engine oil filter for optimal engine protection',
      price: 25.50,
      sku: 'EOF-001',
      stock: 50,
      categoryId: createdCategories[0]?.id || '',
      artikul: 'FIL-ENG-001',
      catalogNumber: 'CAT-001'
    },
    {
      name: 'Hydraulic Pump',
      description: 'Industrial hydraulic pump for heavy machinery',
      price: 1250.00,
      sku: 'HP-002',
      stock: 15,
      categoryId: createdCategories[1]?.id || '',
      artikul: 'HYD-PUMP-002',
      catalogNumber: 'CAT-002'
    },
    {
      name: 'Brake Pads Set',
      description: 'Premium brake pads for reliable stopping power',
      price: 85.00,
      sku: 'BP-003',
      stock: 30,
      categoryId: createdCategories[3]?.id || '',
      artikul: 'BRAKE-PAD-003',
      catalogNumber: 'CAT-003'
    },
    {
      name: 'Air Filter',
      description: 'Heavy-duty air filter for clean engine operation',
      price: 45.00,
      sku: 'AF-004',
      stock: 40,
      categoryId: createdCategories[5]?.id || '',
      artikul: 'AIR-FIL-004',
      catalogNumber: 'CAT-004'
    },
    {
      name: 'Transmission Fluid',
      description: 'High-performance transmission fluid',
      price: 35.00,
      sku: 'TF-005',
      stock: 60,
      categoryId: createdCategories[4]?.id || '',
      artikul: 'TRANS-FLUID-005',
      catalogNumber: 'CAT-005'
    },
    {
      name: 'Electrical Wiring Harness',
      description: 'Complete wiring harness for electrical systems',
      price: 180.00,
      sku: 'EWH-006',
      stock: 20,
      categoryId: createdCategories[2]?.id || '',
      artikul: 'WIRE-HARN-006',
      catalogNumber: 'CAT-006'
    },
    {
      name: 'Tire Set (4 pieces)',
      description: 'Heavy-duty tires for industrial vehicles',
      price: 450.00,
      sku: 'TS-007',
      stock: 10,
      categoryId: createdCategories[6]?.id || '',
      artikul: 'TIRE-SET-007',
      catalogNumber: 'CAT-007'
    },
    {
      name: 'Body Panel - Front Bumper',
      description: 'Replacement front bumper for loader vehicles',
      price: 320.00,
      sku: 'BP-008',
      stock: 8,
      categoryId: createdCategories[7]?.id || '',
      artikul: 'BODY-BUMP-008',
      catalogNumber: 'CAT-008'
    },
    {
      name: 'Hydraulic Hose',
      description: 'High-pressure hydraulic hose',
      price: 75.00,
      sku: 'HH-009',
      stock: 25,
      categoryId: createdCategories[1]?.id || '',
      artikul: 'HYD-HOSE-009',
      catalogNumber: 'CAT-009'
    },
    {
      name: 'Fuel Filter',
      description: 'Premium fuel filter for clean fuel delivery',
      price: 30.00,
      sku: 'FF-010',
      stock: 35,
      categoryId: createdCategories[5]?.id || '',
      artikul: 'FUEL-FIL-010',
      catalogNumber: 'CAT-010'
    }
  ];

  for (const product of products) {
    // Check if product already exists
    const existingProduct = await prisma.product.findFirst({
      where: { sku: product.sku }
    });
    
    if (!existingProduct) {
      await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          sku: product.sku,
          stock: product.stock,
          categoryId: product.categoryId,
          artikul: product.artikul,
          catalogNumber: product.catalogNumber,
          isActive: true,
          isFeatured: Math.random() > 0.5 // Randomly feature some products
        },
      });
      console.log(`Product ${product.name} created`);
    } else {
      console.log(`Product ${product.name} already exists, skipping`);
    }
  }

  console.log('Products created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 