'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useCart } from '../../../components/CartProvider';
import { useAuth } from '../../../components/AuthProvider';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';

// Данные товаров (в реальном проекте будут загружаться из API)
const products = [
  { id: 1, name: "Поршень двигателя Toyota 2.5L", desc: "Оригинальный поршень для двигателя Toyota 2.5L", price: 12500, category: "engine", stock: 15, sku: "TOY-2.5-PISTON", catalogNumber: "TOY-2500-PST-001", brand: "Toyota", fullDesc: "Высококачественный поршень для двигателей Toyota 2.5L. Изготовлен из алюминиевого сплава с керамическим покрытием. Совместим с моделями: Toyota 7FBE, 7FBE15, 7FBE20." },
  { id: 2, name: "Масляный фильтр Komatsu", desc: "Фильтр масляный для погрузчиков Komatsu", price: 850, category: "engine", stock: 45, sku: "KOM-OIL-FILTER", catalogNumber: "KOM-OF-001", brand: "Komatsu", fullDesc: "Фильтр масляный для погрузчиков Komatsu. Обеспечивает качественную фильтрацию моторного масла. Совместим с моделями: Komatsu FG15, FG18, FG20." },
  { id: 3, name: "Воздушный фильтр Nissan", desc: "Фильтр воздушный для двигателей Nissan", price: 1200, category: "engine", stock: 32, sku: "NIS-AIR-FILTER", catalogNumber: "NIS-AF-002", brand: "Nissan", fullDesc: "Воздушный фильтр для двигателей Nissan. Задерживает пыль и загрязнения, обеспечивая чистый воздух для двигателя." },
  { id: 4, name: "Топливный насос Mitsubishi", desc: "Насос топливный высокого давления", price: 18500, category: "engine", stock: 8, sku: "MIT-FUEL-PUMP", catalogNumber: "MIT-FP-003", brand: "Mitsubishi", fullDesc: "Топливный насос высокого давления для дизельных двигателей Mitsubishi. Обеспечивает стабильную подачу топлива." },
  { id: 5, name: "Турбина Garrett", desc: "Турбокомпрессор Garrett для дизельных двигателей", price: 45000, category: "engine", stock: 5, sku: "GAR-TURBO", catalogNumber: "GAR-TB-004", brand: "Garrett", fullDesc: "Турбокомпрессор Garrett для дизельных двигателей. Повышает мощность и эффективность двигателя." },
  { id: 6, name: "Ремень ГРМ Toyota", desc: "Ремень газораспределительного механизма", price: 3200, category: "engine", stock: 25, sku: "TOY-TIMING-BELT", catalogNumber: "TOY-TB-005", brand: "Toyota", fullDesc: "Ремень газораспределительного механизма для двигателей Toyota. Изготовлен из высокопрочных материалов." },
  { id: 7, name: "Клапан впускной Komatsu", desc: "Впускной клапан для двигателей Komatsu", price: 2800, category: "engine", stock: 18, sku: "KOM-INTAKE-VALVE", catalogNumber: "KOM-IV-006", brand: "Komatsu", fullDesc: "Впускной клапан для двигателей Komatsu. Обеспечивает правильную работу газораспределительного механизма." },
  { id: 8, name: "Прокладка ГБЦ Nissan", desc: "Прокладка головки блока цилиндров", price: 4500, category: "engine", stock: 12, sku: "NIS-HEAD-GASKET", catalogNumber: "NIS-HG-007", brand: "Nissan", fullDesc: "Прокладка головки блока цилиндров для двигателей Nissan. Обеспечивает герметичность между блоком и головкой." },
  { id: 9, name: "Гидроцилиндр подъема", desc: "Гидроцилиндр для подъема вил", price: 28000, category: "hydraulic", stock: 6, sku: "HYD-LIFT-CYL", catalogNumber: "HYD-LC-008", brand: "Hydraulic", fullDesc: "Гидроцилиндр для подъема вил погрузчика. Обеспечивает плавное и надежное поднятие грузов." },
  { id: 10, name: "Гидронасос Kawasaki", desc: "Насос гидравлический Kawasaki", price: 35000, category: "hydraulic", stock: 4, sku: "KAW-HYD-PUMP", catalogNumber: "KAW-HP-009", brand: "Kawasaki", fullDesc: "Гидронасос Kawasaki для погрузчиков. Обеспечивает необходимое давление в гидравлической системе." },
  { id: 11, name: "Гидрораспределитель", desc: "Распределитель гидравлический 4-секционный", price: 18500, category: "hydraulic", stock: 9, sku: "HYD-DISTRIBUTOR", catalogNumber: "HYD-DIST-010", brand: "Hydraulic", fullDesc: "Распределитель гидравлический 4-секционный. Управляет потоками рабочей жидкости в гидравлической системе." },
  { id: 12, name: "Гидрошланг высокого давления", desc: "Шланг гидравлический 1/2 дюйма", price: 1200, category: "hydraulic", stock: 35, sku: "HYD-HOSE-HP", catalogNumber: "HYD-HH-011", brand: "Hydraulic", fullDesc: "Гидрошланг высокого давления диаметром 1/2 дюйма. Выдерживает давление до 350 бар." },
  { id: 13, name: "Гидрофильтр", desc: "Фильтр гидравлический тонкой очистки", price: 850, category: "hydraulic", stock: 28, sku: "HYD-FILTER", catalogNumber: "HYD-FIL-012", brand: "Hydraulic", fullDesc: "Фильтр гидравлический тонкой очистки. Обеспечивает чистоту рабочей жидкости в гидравлической системе." },
  { id: 14, name: "Гидробак", desc: "Бак гидравлический 50 литров", price: 8500, category: "hydraulic", stock: 7, sku: "HYD-TANK", catalogNumber: "HYD-TNK-013", brand: "Hydraulic", fullDesc: "Гидробак объемом 50 литров. Резервуар для хранения рабочей жидкости гидравлической системы." },
  { id: 15, name: "Сцепление сухое", desc: "Сцепление сухое для механической КПП", price: 12500, category: "transmission", stock: 11, sku: "TRANS-CLUTCH-DRY", catalogNumber: "TRANS-CD-014", brand: "Transmission", fullDesc: "Сцепление сухое для механической коробки передач. Обеспечивает плавное переключение передач." },
  { id: 16, name: "Сцепление мокрое", desc: "Сцепление мокрое для автоматической КПП", price: 18500, category: "transmission", stock: 8, sku: "TRANS-CLUTCH-WET", catalogNumber: "TRANS-CW-015", brand: "Transmission", fullDesc: "Сцепление мокрое для автоматической коробки передач. Работает в масляной ванне." },
  { id: 17, name: "Карданный вал", desc: "Карданный вал приводной", price: 22000, category: "transmission", stock: 5, sku: "TRANS-CARDAN", catalogNumber: "TRANS-CRD-016", brand: "Transmission", fullDesc: "Карданный вал приводной. Передает крутящий момент от коробки передач к ведущим колесам." },
  { id: 18, name: "Редуктор заднего моста", desc: "Редуктор заднего моста с дифференциалом", price: 45000, category: "transmission", stock: 3, sku: "TRANS-REAR-DIFF", catalogNumber: "TRANS-RD-017", brand: "Transmission", fullDesc: "Редуктор заднего моста с дифференциалом. Обеспечивает передачу крутящего момента к задним колесам." },
  { id: 19, name: "Шестерня главной пары", desc: "Шестерня главной пары редуктора", price: 8500, category: "transmission", stock: 15, sku: "TRANS-MAIN-GEAR", catalogNumber: "TRANS-MG-018", brand: "Transmission", fullDesc: "Шестерня главной пары редуктора. Определяет передаточное число главной передачи." },
  { id: 20, name: "Тормозная колодка передняя", desc: "Колодка тормозная переднего колеса", price: 2800, category: "brakes", stock: 25, sku: "BRAKE-FRONT-PAD", catalogNumber: "BRAKE-FP-019", brand: "Brake", fullDesc: "Тормозная колодка переднего колеса. Обеспечивает эффективное торможение погрузчика." },
  { id: 21, name: "Тормозной диск", desc: "Диск тормозной вентилируемый", price: 4500, category: "brakes", stock: 18, sku: "BRAKE-DISC", catalogNumber: "BRAKE-DISC-020", brand: "Brake", fullDesc: "Тормозной диск вентилируемый. Обеспечивает эффективное охлаждение тормозной системы." },
  { id: 22, name: "Тормозной цилиндр", desc: "Цилиндр тормозной рабочий", price: 3200, category: "brakes", stock: 22, sku: "BRAKE-CYLINDER", catalogNumber: "BRAKE-CYL-021", brand: "Brake", fullDesc: "Тормозной цилиндр рабочий. Преобразует гидравлическое давление в механическое усилие." },
  { id: 23, name: "Тормозная жидкость", desc: "Жидкость тормозная DOT-4", price: 450, category: "brakes", stock: 50, sku: "BRAKE-FLUID", catalogNumber: "BRAKE-FL-022", brand: "Brake", fullDesc: "Тормозная жидкость DOT-4. Обеспечивает передачу давления в тормозной системе." },
  { id: 24, name: "Стартер Mitsubishi", desc: "Стартер электрический для двигателей Mitsubishi", price: 18500, category: "electrical", stock: 7, sku: "ELEC-STARTER-MIT", catalogNumber: "ELEC-SM-023", brand: "Electrical", fullDesc: "Стартер электрический для двигателей Mitsubishi. Обеспечивает запуск двигателя." },
  { id: 25, name: "Генератор Toyota", desc: "Генератор электрический 14V 80A", price: 22000, category: "electrical", stock: 6, sku: "ELEC-GEN-TOY", catalogNumber: "ELEC-GT-024", brand: "Electrical", fullDesc: "Генератор электрический 14V 80A. Обеспечивает зарядку аккумулятора и питание электрооборудования." },
  { id: 26, name: "Аккумулятор 12V 100Ah", desc: "Аккумуляторная батарея 12V 100Ah", price: 8500, category: "electrical", stock: 12, sku: "ELEC-BATTERY", catalogNumber: "ELEC-BAT-025", brand: "Electrical", fullDesc: "Аккумуляторная батарея 12V 100Ah. Обеспечивает питание электрооборудования при выключенном двигателе." },
  { id: 27, name: "Фара передняя", desc: "Фара передняя светодиодная", price: 3200, category: "electrical", stock: 20, sku: "ELEC-FRONT-LIGHT", catalogNumber: "ELEC-FL-026", brand: "Electrical", fullDesc: "Фара передняя светодиодная. Обеспечивает освещение дороги в темное время суток." },
  { id: 28, name: "Поворотник", desc: "Указатель поворота передний", price: 850, category: "electrical", stock: 35, sku: "ELEC-TURN-SIGNAL", catalogNumber: "ELEC-TS-027", brand: "Electrical", fullDesc: "Указатель поворота передний. Обеспечивает сигнализацию о направлении движения." }
];

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { addToCart } = useCart();
  const { isApproved, isAdmin, calculateDiscountedPrice, getDiscountPercentage } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const resolvedParams = use(params);
  const product = products.find(p => p.id === parseInt(resolvedParams.id));

  if (!product) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Товар не найден</h1>
          <p className="text-xl mb-8">Запрашиваемый товар не существует или был удален.</p>
          <Link href="/catalog" className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-bold text-lg transition">
            Вернуться в каталог
          </Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: isApproved && !isAdmin ? calculateDiscountedPrice(product.price) : product.price,
      quantity,
      sku: product.sku,
      stock: product.stock
    });
  };

  const discountedPrice = isApproved && !isAdmin ? calculateDiscountedPrice(product.price) : product.price;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link href="/" className="text-cyan-400 hover:text-cyan-300">Главная</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link href="/catalog" className="text-cyan-400 hover:text-cyan-300">Каталог</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-white">{product.name}</li>
          </ol>
        </nav>

        {/* Discount Banner for Approved Users */}
        {isApproved && !isAdmin && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2">🎉 Скидка {getDiscountPercentage()}% для одобренных пользователей!</h2>
            <p>Цена указана с учетом скидки</p>
          </div>
        )}

        {/* Approval Pending Banner */}
        {!isApproved && !isAdmin && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2">⏳ Ваш аккаунт ожидает одобрения</h2>
            <p>После одобрения администратором вы получите доступ к специальным ценам</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Изображение товара */}
          <div className="space-y-6">
            <div className="w-full h-96 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-4xl">{product.brand}</span>
            </div>
            
            {/* Дополнительные изображения */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{product.brand}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Информация о товаре */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-300 text-lg mb-4">{product.desc}</p>
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-cyan-500 text-white rounded-full text-sm font-semibold">
                  {product.brand}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  product.stock > 10 ? 'bg-green-500 text-white' : 
                  product.stock > 0 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {product.stock > 0 ? `${product.stock} шт в наличии` : 'Нет в наличии'}
                </span>
              </div>
            </div>

            {/* Цена */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {isApproved && !isAdmin ? (
                  <>
                    <span className="text-3xl text-gray-400 line-through">{product.price.toLocaleString()} ₽</span>
                    <span className="text-4xl font-bold text-green-400">{discountedPrice.toLocaleString()} ₽</span>
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                      -{getDiscountPercentage()}%
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-cyan-400">{product.price.toLocaleString()} ₽</span>
                )}
              </div>
              
              {!isApproved && !isAdmin && (
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⏳ После одобрения администратором вы получите скидку на этот товар!
                  </p>
                </div>
              )}
            </div>

            {/* Количество и кнопки */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold">Количество:</label>
                <div className="flex items-center border border-cyan-500/20 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-cyan-400 hover:text-white transition"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 text-cyan-400 hover:text-white transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 rounded-xl text-white font-semibold transition"
                >
                  <FaShoppingCart />
                  Добавить в корзину
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="px-6 py-3 bg-white/10 hover:bg-cyan-600 rounded-xl text-white transition"
                >
                  {isFavorite ? <FaHeart className="text-red-400" /> : <FaRegHeart />}
                </button>
              </div>
            </div>

            {/* Характеристики */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Характеристики</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Артикул:</span>
                  <p className="font-semibold">{product.sku}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Каталожный номер:</span>
                  <p className="font-semibold">{product.catalogNumber}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Бренд:</span>
                  <p className="font-semibold">{product.brand}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Категория:</span>
                  <p className="font-semibold">{product.category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Подробное описание */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Подробное описание</h2>
          <div className="bg-[#1e293b] rounded-xl p-8">
            <p className="text-gray-300 leading-relaxed">{product.fullDesc}</p>
          </div>
        </div>

        {/* Похожие товары */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Похожие товары</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter(p => p.category === product.category && p.id !== product.id)
              .slice(0, 4)
              .map(relatedProduct => (
                <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`} className="group">
                  <div className="bg-[#1e293b] rounded-xl p-4 hover:scale-105 transition shadow-lg">
                    <div className="w-full h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{relatedProduct.brand}</span>
                    </div>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{relatedProduct.name}</h3>
                    <div className="flex items-center justify-between">
                      {isApproved && !isAdmin ? (
                        <>
                          <span className="text-sm text-gray-400 line-through">{relatedProduct.price.toLocaleString()} ₽</span>
                          <span className="text-lg font-bold text-green-400">{calculateDiscountedPrice(relatedProduct.price).toLocaleString()} ₽</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-cyan-400">{relatedProduct.price.toLocaleString()} ₽</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
} 