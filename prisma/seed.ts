import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 12)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sado-parts.ru' },
    update: {},
    create: {
      email: 'admin@sado-parts.ru',
      password: hashedPassword,
      name: 'Admin User',
      phone: '+994501234567',
      isAdmin: true,
      isApproved: true,
    },
  })

  console.log('✅ Admin user created:', adminUser.email)

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Engine Parts' },
      update: {},
      create: {
        name: 'Engine Parts',
        description: 'Engine components and spare parts',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Transmission' },
      update: {},
      create: {
        name: 'Transmission',
        description: 'Transmission system parts',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Brake System' },
      update: {},
      create: {
        name: 'Brake System',
        description: 'Brake components and parts',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Categories created:', categories.length)

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'ENG-001' },
      update: {},
      create: {
        name: 'Engine Oil Filter',
        description: 'High-quality engine oil filter for optimal performance',
        price: 25.99,
        sku: 'ENG-001',
        stock: 50,
        images: ['/uploads/oil-filter-1.jpg'],
        isActive: true,
        isFeatured: true,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'TRANS-001' },
      update: {},
      create: {
        name: 'Transmission Fluid',
        description: 'Premium transmission fluid for smooth operation',
        price: 45.99,
        sku: 'TRANS-001',
        stock: 30,
        images: ['/uploads/transmission-fluid-1.jpg'],
        isActive: true,
        isFeatured: false,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BRAKE-001' },
      update: {},
      create: {
        name: 'Brake Pads Set',
        description: 'Durable brake pads for reliable stopping power',
        price: 89.99,
        sku: 'BRAKE-001',
        stock: 25,
        images: ['/uploads/brake-pads-1.jpg'],
        isActive: true,
        isFeatured: true,
        categoryId: categories[2].id,
      },
    }),
  ])

  console.log('✅ Products created:', products.length)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 