'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../components/AuthProvider";

// Sample product data
const hotProducts = [
  { id: 1, name: "Поршень двигателя Toyota 2.5L", price: 12500, brand: "Toyota", image: "/product1.jpg", sku: "TOY-2.5-PISTON" },
  { id: 2, name: "Масляный фильтр Komatsu", price: 850, brand: "Komatsu", image: "/product2.jpg", sku: "KOM-OIL-FILTER" },
  { id: 3, name: "Воздушный фильтр Nissan", price: 1200, brand: "Nissan", image: "/product3.jpg", sku: "NIS-AIR-FILTER" },
  { id: 4, name: "Топливный насос Mitsubishi", price: 18500, brand: "Mitsubishi", image: "/product4.jpg", sku: "MIT-FUEL-PUMP" }
];

const newArrivals = [
  { id: 5, name: "Турбина Garrett", price: 45000, brand: "Garrett", image: "/product5.jpg", sku: "GAR-TURBO" },
  { id: 6, name: "Ремень ГРМ Toyota", price: 3200, brand: "Toyota", image: "/product6.jpg", sku: "TOY-TIMING-BELT" },
  { id: 7, name: "Клапан впускной Komatsu", price: 2800, brand: "Komatsu", image: "/product7.jpg", sku: "KOM-INTAKE-VALVE" },
  { id: 8, name: "Прокладка ГБЦ Nissan", price: 4500, brand: "Nissan", image: "/product8.jpg", sku: "NIS-HEAD-GASKET" }
];

const featuredCategories = [
  { id: "engine", name: "Двигатели", count: 15, image: "/category-engine.jpg" },
  { id: "hydraulic", name: "Гидравлика", count: 12, image: "/category-hydraulic.jpg" },
  { id: "transmission", name: "Трансмиссия", count: 8, image: "/category-transmission.jpg" },
  { id: "brakes", name: "Тормозная система", count: 10, image: "/category-brakes.jpg" },
  { id: "electrical", name: "Электрика", count: 18, image: "/category-electric.jpg" },
  { id: "steering", name: "Рулевое управление", count: 6, image: "/category-steering.jpg" }
];

export default function Home() {
  const { isApproved, isAdmin, calculateDiscountedPrice, getDiscountPercentage } = useAuth();

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white">
      {/* Баннер */}
      <section className="w-full flex flex-col md:flex-row items-stretch justify-between pt-24 pb-0 bg-gradient-to-r from-[#0ea5e9] via-[#1e293b] to-[#0f172a] rounded-b-3xl shadow-2xl min-h-[320px] md:min-h-[480px]">
        <div className="flex-1 flex flex-col gap-6 items-start justify-center px-6 md:px-16 z-10">
          <span className="uppercase tracking-widest text-cyan-300 font-bold text-lg">Более 20 лет опыта</span>
          <h1 className="text-4xl md:text-6xl font-extrabold neon-text mb-2">Премиум запчасти для вилочных погрузчиков</h1>
          <p className="text-xl md:text-2xl max-w-xl mb-4">Оригинальные и аналоговые детали. Быстрая доставка по Москве и России. AR/VR-каталог, поддержка 24/7, лучшие цены и сервис.</p>
          <div className="flex gap-4 mt-2">
            <Link href="/catalog" className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 font-bold text-lg shadow-lg transition">Каталог</Link>
            <Link href="/contacts" className="px-8 py-4 rounded-xl bg-white/10 hover:bg-cyan-600 font-bold text-lg shadow-lg transition">Контакты</Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[240px] md:min-h-[480px] max-h-[520px]">
          <div className="w-full h-full relative flex items-center justify-center">
            <Image src="/banner-forklift-real.jpg" alt="Вилочный погрузчик" fill style={{objectFit:'cover'}} className="rounded-b-3xl md:rounded-l-3xl md:rounded-b-none shadow-2xl" priority />
          </div>
        </div>
      </section>

      {/* Discount Banner for Approved Users */}
      {isApproved && !isAdmin && (
        <section className="w-full max-w-7xl mx-auto px-6 mt-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-2">🎉 Специальное предложение для одобренных пользователей!</h2>
            <p className="text-lg">Получите скидку {getDiscountPercentage()}% на все товары</p>
          </div>
        </section>
      )}

      {/* Approval Pending Banner */}
      {!isApproved && !isAdmin && (
        <section className="w-full max-w-7xl mx-auto px-6 mt-8">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-2">⏳ Ваш аккаунт ожидает одобрения</h2>
            <p className="text-lg">После одобрения администратором вы получите доступ к специальным ценам</p>
          </div>
        </section>
      )}

      {/* Hot Products */}
      <section className="w-full max-w-7xl mx-auto px-6 mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold neon-text">🔥 Горячие предложения</h2>
          <Link href="/catalog" className="text-cyan-400 hover:text-cyan-300 font-semibold">Смотреть все →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hotProducts.map(product => (
            <div key={product.id} className="bg-[#1e293b] rounded-xl p-4 hover:scale-105 transition shadow-lg">
              <div className="w-full h-48 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{product.brand}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
              <p className="text-cyan-300 text-sm mb-2">Артикул: {product.sku}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {isApproved && !isAdmin ? (
                    <>
                      <span className="text-lg text-gray-400 line-through">{product.price.toLocaleString()} ₽</span>
                      <span className="text-2xl font-bold text-green-400">{calculateDiscountedPrice(product.price).toLocaleString()} ₽</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-cyan-400">{product.price.toLocaleString()} ₽</span>
                  )}
                </div>
                <Link href={`/product/${product.id}`} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold text-sm transition">
                  Подробнее
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="w-full max-w-7xl mx-auto px-6 mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold neon-text">🆕 Новые поступления</h2>
          <Link href="/catalog" className="text-cyan-400 hover:text-cyan-300 font-semibold">Смотреть все →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map(product => (
            <div key={product.id} className="bg-[#1e293b] rounded-xl p-4 hover:scale-105 transition shadow-lg border border-cyan-500/20">
              <div className="w-full h-48 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{product.brand}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
              </div>
              <p className="text-cyan-300 text-sm mb-2">Артикул: {product.sku}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {isApproved && !isAdmin ? (
                    <>
                      <span className="text-lg text-gray-400 line-through">{product.price.toLocaleString()} ₽</span>
                      <span className="text-2xl font-bold text-green-400">{calculateDiscountedPrice(product.price).toLocaleString()} ₽</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-cyan-400">{product.price.toLocaleString()} ₽</span>
                  )}
                </div>
                <Link href={`/product/${product.id}`} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold text-sm transition">
                  Подробнее
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="w-full max-w-7xl mx-auto px-6 mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold neon-text">📂 Популярные категории</h2>
          <Link href="/catalog" className="text-cyan-400 hover:text-cyan-300 font-semibold">Все категории →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCategories.map(category => (
            <Link key={category.id} href={`/catalog?category=${category.id}`} className="group">
              <div className="bg-[#1e293b] rounded-xl p-6 hover:scale-105 transition shadow-lg border border-cyan-500/20 group-hover:border-cyan-500">
                <div className="w-full h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{category.name}</span>
                </div>
                <h3 className="font-semibold text-xl mb-2">{category.name}</h3>
                <p className="text-cyan-300 text-sm">{category.count} товаров</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Категории */}
      <section className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 px-6">
        <div className="bg-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-lg hover:scale-105 transition">
          <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-cyan-500 bg-cyan-900 flex items-center justify-center">
            <Image src="/category-forklift.jpg" alt="Вилочные погрузчики" width={112} height={112} style={{objectFit:'cover'}} />
          </div>
          <h2 className="text-2xl font-bold">Вилочные погрузчики</h2>
          <p className="text-center">Оригинальные и аналоговые детали для всех популярных моделей.</p>
          <Link href="/catalog?category=forklift" className="mt-2 px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">Смотреть</Link>
        </div>
        <div className="bg-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-lg hover:scale-105 transition">
          <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-cyan-500 bg-cyan-900 flex items-center justify-center">
            <Image src="/category-engine.jpg" alt="Двигатели и запчасти" width={112} height={112} style={{objectFit:'cover'}} />
          </div>
          <h2 className="text-2xl font-bold">Двигатели и запчасти</h2>
          <p className="text-center">Двигатели, фильтры, трансмиссии, гидравлика, тормоза и другое.</p>
          <Link href="/catalog?category=engine" className="mt-2 px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">Смотреть</Link>
        </div>
        <div className="bg-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-lg hover:scale-105 transition">
          <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-cyan-500 bg-cyan-900 flex items-center justify-center">
            <Image src="/category-electric.jpg" alt="Электрика и аксессуары" width={112} height={112} style={{objectFit:'cover'}} />
          </div>
          <h2 className="text-2xl font-bold">Электрика и аксессуары</h2>
          <p className="text-center">Электрические детали, аккумуляторы, освещение, аксессуары.</p>
          <Link href="/catalog?category=electric" className="mt-2 px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">Смотреть</Link>
        </div>
      </section>
    </main>
  );
}
