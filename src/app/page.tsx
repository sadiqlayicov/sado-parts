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

export default function HomePage() {
  return (
    <main style={{ padding: 32, textAlign: 'center' }}>
      <h1>"Sado Parts" Ana Səhifə</h1>
      <p>Sayt uğurla deploy olundu! Menyudan və ya /catalog səhifəsindən istifadə edin.</p>
    </main>
  );
}
