import { PrismaClient } from '@prisma/client';
import Image from "next/image";

const prisma = new PrismaClient();

export default async function HomePage() {
  // Real kateqoriyalar və məhsullar database-dən alınır
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    take: 5,
    orderBy: { name: 'asc' }
  });
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { category: true }
  });

  return (
    <main style={{ padding: 32, textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>&quot;Sado Parts&quot; Ana Səhifə</h1>
      <p style={{ marginBottom: 32 }}>Sayt uğurla deploy olundu! Menyudan və ya /catalog səhifəsindən istifadə edin.</p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>🛍️ Yeni Məhsullar</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          {products.map(product => (
            <div key={product.id} style={{ background: '#222', color: '#fff', borderRadius: 12, padding: 16, width: 220 }}>
              <div style={{ height: 100, marginBottom: 8, background: '#333', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src={"/product1.jpg"} alt={product.name} width={100} height={80} style={{ objectFit: 'cover', borderRadius: 8 }} />
              </div>
              <h3 style={{ fontWeight: 'bold', margin: '12px 0 4px' }}>{product.name}</h3>
              <div style={{ color: '#0af', fontWeight: 'bold' }}>{product.price.toLocaleString()}₽</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{product.category?.name}</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>SKU: {product.sku}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>📂 Kateqoriyalar</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          {categories.map(category => (
            <div key={category.id} style={{ background: '#222', color: '#fff', borderRadius: 12, padding: 16, width: 200 }}>
              <div style={{ height: 80, marginBottom: 8, background: '#333', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src={"/category-engine.jpg"} alt={category.name} width={100} height={60} style={{ objectFit: 'cover', borderRadius: 8 }} />
              </div>
              <h3 style={{ fontWeight: 'bold', margin: '12px 0 4px' }}>{category.name}</h3>
              <div style={{ fontSize: 12, color: '#aaa' }}>{category.description}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
