import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sado-parts.ru' },
    update: {},
    create: {
      email: 'admin@sado-parts.ru',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isApproved: true,
      isActive: true
    }
  })

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-engine' },
      update: {},
      create: {
        id: 'cat-engine',
        name: 'Двигатели',
        description: 'Запчасти для двигателей вилочных погрузчиков'
      }
    }),
    prisma.category.upsert({
      where: { id: 'cat-transmission' },
      update: {},
      create: {
        id: 'cat-transmission',
        name: 'Трансмиссия',
        description: 'Запчасти для трансмиссии'
      }
    }),
    prisma.category.upsert({
      where: { id: 'cat-electrical' },
      update: {},
      create: {
        id: 'cat-electrical',
        name: 'Электрика',
        description: 'Электрические компоненты'
      }
    })
  ])

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'PISTON-001' },
      update: {},
      create: {
        name: 'Поршень двигателя',
        description: 'Высококачественный поршень для двигателей вилочных погрузчиков',
        price: 15000,
        sku: 'PISTON-001',
        stock: 50,
        categoryId: categories[0].id,
        isActive: true
      }
    }),
    prisma.product.upsert({
      where: { sku: 'OIL-FILTER-001' },
      update: {},
      create: {
        name: 'Масляный фильтр',
        description: 'Фильтр масла для двигателей',
        price: 2500,
        sku: 'OIL-FILTER-001',
        stock: 100,
        categoryId: categories[0].id,
        isActive: true
      }
    }),
    prisma.product.upsert({
      where: { sku: 'TIMING-BELT-001' },
      update: {},
      create: {
        name: 'Ремень ГРМ',
        description: 'Ремень газораспределительного механизма',
        price: 8000,
        sku: 'TIMING-BELT-001',
        stock: 30,
        categoryId: categories[0].id,
        isActive: true
      }
    }),
    prisma.product.upsert({
      where: { sku: 'CLUTCH-001' },
      update: {},
      create: {
        name: 'Сцепление',
        description: 'Комплект сцепления для вилочных погрузчиков',
        price: 45000,
        sku: 'CLUTCH-001',
        stock: 15,
        categoryId: categories[1].id,
        isActive: true
      }
    }),
    prisma.product.upsert({
      where: { sku: 'BATTERY-001' },
      update: {},
      create: {
        name: 'Аккумулятор',
        description: 'Аккумуляторная батарея для вилочных погрузчиков',
        price: 35000,
        sku: 'BATTERY-001',
        stock: 25,
        categoryId: categories[2].id,
        isActive: true
      }
    })
  ])

  // Create sample users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'customer1@example.com' },
      update: {},
      create: {
        email: 'customer1@example.com',
        password: await hashPassword('password123'),
        firstName: 'Иван',
        lastName: 'Петров',
        phone: '+7 999 123-45-67',
        role: 'CUSTOMER',
        isApproved: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'customer2@example.com' },
      update: {},
      create: {
        email: 'customer2@example.com',
        password: await hashPassword('password123'),
        firstName: 'Мария',
        lastName: 'Сидорова',
        phone: '+7 999 234-56-78',
        role: 'CUSTOMER',
        isApproved: false
      }
    })
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user: ${admin.email}`)
  console.log(`📦 Categories created: ${categories.length}`)
  console.log(`🛍️ Products created: ${products.length}`)
  console.log(`👥 Users created: ${users.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 