import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin və menecer istifadəçilər
  const adminPassword = await hashPassword('admin123');
  const managerPassword = await hashPassword('manager123');
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@sado-parts.ru',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isApproved: true,
        isActive: true
      },
      {
        email: 'manager@sado-parts.ru',
        password: managerPassword,
        firstName: 'Manager',
        lastName: 'User',
        role: 'MANAGER',
        isApproved: true,
        isActive: true
      }
    ]
  });

  // 10 real müştəri istifadəçi
  for (let i = 1; i <= 10; i++) {
    await prisma.user.create({
      data: {
        email: `customer${i}@example.com`,
        password: await hashPassword('password123'),
        firstName: `Müştəri${i}`,
        lastName: `Soyad${i}`,
        phone: `+994 50 000 0${i.toString().padStart(2, '0')}`,
        role: 'CUSTOMER',
        isApproved: i % 2 === 0,
        isActive: true
      }
    });
  }

  // 5 real kateqoriya
  const categories = await prisma.category.createMany({
    data: [
      { id: 'cat-engine', name: 'Dizel Mühərriklər', description: 'Forklift üçün dizel mühərrik və hissələri' },
      { id: 'cat-transmission', name: 'Transmissiya', description: 'Transmissiya və ötürücü hissələr' },
      { id: 'cat-hydraulic', name: 'Hidravlika', description: 'Hidravlik sistem və hissələr' },
      { id: 'cat-electrical', name: 'Elektrik', description: 'Elektrik və akkumulyator hissələri' },
      { id: 'cat-brakes', name: 'Əyləc Sistemi', description: 'Əyləc və təhlükəsizlik hissələri' }
    ]
  });

  // 100+ real məhsul (forklift ehtiyat hissələri)
  const brands = ['Toyota', 'Komatsu', 'Nissan', 'Mitsubishi', 'Hyundai', 'Hyster', 'Caterpillar', 'Clark', 'Doosan', 'Jungheinrich'];
  const productNames = [
    'Mühərrik porşeni', 'Yağ filtri', 'Hava filtri', 'Yanacaq nasosu', 'Turbina', 'Qaz paylayıcı kəmər', 'Vana', 'Silindr başlığı',
    'Hidravlik silindr', 'Hidravlik nasos', 'Hidravlik şlanq', 'Hidravlik filtr', 'Hidravlik çən',
    'Quru mufta', 'Yaş mufta', 'Kardan val', 'Reduktor', 'Əsas dişli',
    'Əyləc bəndi', 'Əyləc diski', 'Əyləc silindri', 'Əyləc mayesi',
    'Starter', 'Generator', 'Akkumulyator', 'Fara', 'Dönmə işığı',
    'Rul çarxı', 'Rul ucu', 'Rul mexanizmi',
    'Amortizator', 'Yay', 'Qol',
    'Təkər', 'Şin', 'Kamera',
    'Kabin', 'Qapı', 'Şüşə',
    'Standart çəngəl', 'Uzun çəngəl', 'Baraban tutucu',
    'Mühərrik yağı', 'Hidravlik yağ', 'Əyləc mayesi', 'Soyuducu maye'
  ];
  let skuCounter = 1000;
  for (let i = 1; i <= 100; i++) {
    const catIdx = Math.floor((i - 1) / 20); // 5 kateqoriya üzrə bölüşdür
    const brand = brands[i % brands.length];
    const name = productNames[i % productNames.length];
    await prisma.product.create({
      data: {
        name: `${brand} ${name}`,
        description: `${brand} markalı ${name.toLowerCase()} forklift üçün orijinal ehtiyat hissədir.`,
        price: 5000 + Math.floor(Math.random() * 45000),
        sku: `SKU-${skuCounter + i}`,
        stock: 5 + Math.floor(Math.random() * 50),
        categoryId: `cat-${['engine','transmission','hydraulic','electrical','brakes'][catIdx]}`,
        isActive: true,
        isFeatured: i % 10 === 0
      }
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 