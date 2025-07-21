'use client';

import Link from "next/link";
import { useState, useMemo } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";

const products = [
  // Двигатели и запчасти
  { id: 1, name: "Поршень двигателя Toyota 2.5L", desc: "Оригинальный поршень для двигателя Toyota 2.5L", price: 12500, category: "engine", stock: 15, sku: "TOY-2.5-PISTON", catalogNumber: "TOY-2500-PST-001", brand: "Toyota" },
  { id: 2, name: "Масляный фильтр Komatsu", desc: "Фильтр масляный для погрузчиков Komatsu", price: 850, category: "engine", stock: 45, sku: "KOM-OIL-FILTER", catalogNumber: "KOM-OF-001", brand: "Komatsu" },
  { id: 3, name: "Воздушный фильтр Nissan", desc: "Фильтр воздушный для двигателей Nissan", price: 1200, category: "engine", stock: 32, sku: "NIS-AIR-FILTER", catalogNumber: "NIS-AF-002", brand: "Nissan" },
  { id: 4, name: "Топливный насос Mitsubishi", desc: "Насос топливный высокого давления", price: 18500, category: "engine", stock: 8, sku: "MIT-FUEL-PUMP", catalogNumber: "MIT-FP-003", brand: "Mitsubishi" },
  { id: 5, name: "Турбина Garrett", desc: "Турбокомпрессор Garrett для дизельных двигателей", price: 45000, category: "engine", stock: 5, sku: "GAR-TURBO", catalogNumber: "GAR-TB-004", brand: "Garrett" },
  { id: 6, name: "Ремень ГРМ Toyota", desc: "Ремень газораспределительного механизма", price: 3200, category: "engine", stock: 25, sku: "TOY-TIMING-BELT", catalogNumber: "TOY-TB-005", brand: "Toyota" },
  { id: 7, name: "Клапан впускной Komatsu", desc: "Впускной клапан для двигателей Komatsu", price: 2800, category: "engine", stock: 18, sku: "KOM-INTAKE-VALVE", catalogNumber: "KOM-IV-006", brand: "Komatsu" },
  { id: 8, name: "Прокладка ГБЦ Nissan", desc: "Прокладка головки блока цилиндров", price: 4500, category: "engine", stock: 12, sku: "NIS-HEAD-GASKET", catalogNumber: "NIS-HG-007", brand: "Nissan" },
  
  // Гидравлика
  { id: 9, name: "Гидроцилиндр подъема", desc: "Гидроцилиндр для подъема вил", price: 28000, category: "hydraulic", stock: 6, sku: "HYD-LIFT-CYL", catalogNumber: "HYD-LC-008", brand: "Hydraulic" },
  { id: 10, name: "Гидронасос Kawasaki", desc: "Насос гидравлический Kawasaki", price: 35000, category: "hydraulic", stock: 4, sku: "KAW-HYD-PUMP", catalogNumber: "KAW-HP-009", brand: "Kawasaki" },
  { id: 11, name: "Гидрораспределитель", desc: "Распределитель гидравлический 4-секционный", price: 18500, category: "hydraulic", stock: 9, sku: "HYD-DISTRIBUTOR", catalogNumber: "HYD-DIST-010", brand: "Hydraulic" },
  { id: 12, name: "Гидрошланг высокого давления", desc: "Шланг гидравлический 1/2 дюйма", price: 1200, category: "hydraulic", stock: 35, sku: "HYD-HOSE-HP", catalogNumber: "HYD-HH-011", brand: "Hydraulic" },
  { id: 13, name: "Гидрофильтр", desc: "Фильтр гидравлический тонкой очистки", price: 850, category: "hydraulic", stock: 28, sku: "HYD-FILTER", catalogNumber: "HYD-FIL-012", brand: "Hydraulic" },
  { id: 14, name: "Гидробак", desc: "Бак гидравлический 50 литров", price: 8500, category: "hydraulic", stock: 7, sku: "HYD-TANK", catalogNumber: "HYD-TNK-013", brand: "Hydraulic" },
  
  // Трансмиссия
  { id: 15, name: "Сцепление сухое", desc: "Сцепление сухое для механической КПП", price: 12500, category: "transmission", stock: 11, sku: "TRANS-CLUTCH-DRY", catalogNumber: "TRANS-CD-014", brand: "Transmission" },
  { id: 16, name: "Сцепление мокрое", desc: "Сцепление мокрое для автоматической КПП", price: 18500, category: "transmission", stock: 8, sku: "TRANS-CLUTCH-WET", catalogNumber: "TRANS-CW-015", brand: "Transmission" },
  { id: 17, name: "Карданный вал", desc: "Карданный вал приводной", price: 22000, category: "transmission", stock: 5, sku: "TRANS-CARDAN", catalogNumber: "TRANS-CRD-016", brand: "Transmission" },
  { id: 18, name: "Редуктор заднего моста", desc: "Редуктор заднего моста с дифференциалом", price: 45000, category: "transmission", stock: 3, sku: "TRANS-REAR-DIFF", catalogNumber: "TRANS-RD-017", brand: "Transmission" },
  { id: 19, name: "Шестерня главной пары", desc: "Шестерня главной пары редуктора", price: 8500, category: "transmission", stock: 15, sku: "TRANS-MAIN-GEAR", catalogNumber: "TRANS-MG-018", brand: "Transmission" },
  
  // Тормозная система
  { id: 20, name: "Тормозная колодка передняя", desc: "Колодка тормозная переднего колеса", price: 2800, category: "brakes", stock: 25, sku: "BRAKE-FRONT-PAD", catalogNumber: "BRAKE-FP-019", brand: "Brake" },
  { id: 21, name: "Тормозной диск", desc: "Диск тормозной вентилируемый", price: 4500, category: "brakes", stock: 18, sku: "BRAKE-DISC", catalogNumber: "BRAKE-DISC-020", brand: "Brake" },
  { id: 22, name: "Тормозной цилиндр", desc: "Цилиндр тормозной рабочий", price: 3200, category: "brakes", stock: 22, sku: "BRAKE-CYLINDER", catalogNumber: "BRAKE-CYL-021", brand: "Brake" },
  { id: 23, name: "Тормозная жидкость", desc: "Жидкость тормозная DOT-4", price: 450, category: "brakes", stock: 50, sku: "BRAKE-FLUID", catalogNumber: "BRAKE-FL-022", brand: "Brake" },
  
  // Электрика
  { id: 24, name: "Стартер Mitsubishi", desc: "Стартер электрический для двигателей Mitsubishi", price: 18500, category: "electrical", stock: 7, sku: "ELEC-STARTER-MIT", catalogNumber: "ELEC-SM-023", brand: "Electrical" },
  { id: 25, name: "Генератор Toyota", desc: "Генератор электрический 14V 80A", price: 22000, category: "electrical", stock: 6, sku: "ELEC-GEN-TOY", catalogNumber: "ELEC-GT-024", brand: "Electrical" },
  { id: 26, name: "Аккумулятор 12V 100Ah", desc: "Аккумуляторная батарея 12V 100Ah", price: 8500, category: "electrical", stock: 12, sku: "ELEC-BATTERY", catalogNumber: "ELEC-BAT-025", brand: "Electrical" },
  { id: 27, name: "Фара передняя", desc: "Фара передняя светодиодная", price: 3200, category: "electrical", stock: 20, sku: "ELEC-FRONT-LIGHT", catalogNumber: "ELEC-FL-026", brand: "Electrical" },
  { id: 28, name: "Поворотник", desc: "Указатель поворота передний", price: 850, category: "electrical", stock: 35, sku: "ELEC-TURN-SIGNAL", catalogNumber: "ELEC-TS-027", brand: "Electrical" },
  
  // Рулевое управление
  { id: 30, name: "Рулевая рейка", desc: "Рулевая рейка с гидроусилителем", price: 35000, category: "steering", stock: 4, sku: "STEER-RACK", catalogNumber: "STEER-RACK-029", brand: "Steering" },
  { id: 31, name: "Рулевой наконечник", desc: "Наконечник рулевой тяги", price: 1800, category: "steering", stock: 25, sku: "STEER-TIE-ROD", catalogNumber: "STEER-TR-030", brand: "Steering" },
  { id: 32, name: "Рулевое колесо", desc: "Рулевое колесо с подушкой безопасности", price: 8500, category: "steering", stock: 8, sku: "STEER-WHEEL", catalogNumber: "STEER-WH-031", brand: "Steering" },
  
  // Подвеска
  { id: 33, name: "Амортизатор передний", desc: "Амортизатор передней подвески", price: 4500, category: "suspension", stock: 15, sku: "SUSP-FRONT-SHOCK", catalogNumber: "SUSP-FS-032", brand: "Suspension" },
  { id: 34, name: "Пружина подвески", desc: "Пружина подвески задняя", price: 2800, category: "suspension", stock: 20, sku: "SUSP-SPRING", catalogNumber: "SUSP-SPR-033", brand: "Suspension" },
  { id: 35, name: "Рычаг подвески", desc: "Рычаг передней подвески", price: 6500, category: "suspension", stock: 10, sku: "SUSP-ARM", catalogNumber: "SUSP-ARM-034", brand: "Suspension" },
  
  // Колеса и шины
  { id: 36, name: "Колесо 16x6.5", desc: "Колесо стальное 16x6.5 дюймов", price: 8500, category: "wheels", stock: 8, sku: "WHEEL-16x6.5", catalogNumber: "WHEEL-16-035", brand: "Wheels" },
  { id: 37, name: "Шина 16x6.5", desc: "Шина 16x6.5 дюймов", price: 12500, category: "wheels", stock: 12, sku: "TIRE-16x6.5", catalogNumber: "TIRE-16-036", brand: "Wheels" },
  { id: 38, name: "Камера 16x6.5", desc: "Камера 16x6.5 дюймов", price: 2800, category: "wheels", stock: 25, sku: "TUBE-16x6.5", catalogNumber: "TUBE-16-037", brand: "Wheels" },
  
  // Кузов и кабина
  { id: 39, name: "Кабина погрузчика", desc: "Кабина погрузчика с остеклением", price: 85000, category: "body", stock: 2, sku: "BODY-CABIN", catalogNumber: "BODY-CAB-038", brand: "Body" },
  { id: 40, name: "Дверь кабины", desc: "Дверь кабины левая", price: 18500, category: "body", stock: 5, sku: "BODY-DOOR", catalogNumber: "BODY-DR-039", brand: "Body" },
  { id: 41, name: "Стекло лобовое", desc: "Стекло лобовое кабины", price: 8500, category: "body", stock: 8, sku: "BODY-WINDSHIELD", catalogNumber: "BODY-WS-040", brand: "Body" },
  
  // Вилы и грузозахват
  { id: 42, name: "Вилы стандартные", desc: "Вилы стандартные 1200x150x40", price: 12500, category: "forks", stock: 15, sku: "FORKS-STANDARD", catalogNumber: "FORKS-ST-041", brand: "Forks" },
  { id: 43, name: "Вилы длинные", desc: "Вилы длинные 1500x150x40", price: 18500, category: "forks", stock: 8, sku: "FORKS-LONG", catalogNumber: "FORKS-LG-042", brand: "Forks" },
  { id: 44, name: "Грузозахват", desc: "Грузозахват для бочек", price: 45000, category: "forks", stock: 3, sku: "FORKS-DRUM-CLAMP", catalogNumber: "FORKS-DC-043", brand: "Forks" },
  
  // Расходные материалы
  { id: 45, name: "Масло моторное 15W-40", desc: "Масло моторное 15W-40 4л", price: 850, category: "consumables", stock: 50, sku: "CONS-MOTOR-OIL", catalogNumber: "CONS-MO-044", brand: "Consumables" },
  { id: 46, name: "Масло гидравлическое", desc: "Масло гидравлическое 20л", price: 2800, category: "consumables", stock: 25, sku: "CONS-HYD-OIL", catalogNumber: "CONS-HO-045", brand: "Consumables" },
  { id: 47, name: "Тормозная жидкость DOT-4", desc: "Тормозная жидкость DOT-4 1л", price: 450, category: "consumables", stock: 40, sku: "CONS-BRAKE-FLUID", catalogNumber: "CONS-BF-046", brand: "Consumables" },
  { id: 48, name: "Охлаждающая жидкость", desc: "Охлаждающая жидкость 5л", price: 850, category: "consumables", stock: 30, sku: "CONS-COOLANT", catalogNumber: "CONS-COOL-047", brand: "Consumables" }
];

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const { isApproved, isAdmin, calculateDiscountedPrice, getDiscountPercentage } = useAuth();
  
  const [filter, setFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setFilter(cat);
    const brand = searchParams.get("brand");
    if (brand) setBrandFilter(brand);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const matchesCategory = !filter || product.category === filter;
      const matchesBrand = !brandFilter || product.brand === brandFilter;
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesPrice = true;
      if (priceFilter) {
        const [min, max] = priceFilter.split('-').map(Number);
        if (max) {
          matchesPrice = product.price >= min && product.price <= max;
        } else {
          matchesPrice = product.price >= min;
        }
      }
      
      let matchesStock = true;
      if (stockFilter) {
        const [min, max] = stockFilter.split('-').map(Number);
        if (max) {
          matchesStock = product.stock >= min && product.stock <= max;
        } else {
          matchesStock = product.stock >= min;
        }
      }
      
      return matchesCategory && matchesBrand && matchesSearch && matchesPrice && matchesStock;
    });
  }, [filter, brandFilter, searchQuery, priceFilter, stockFilter]);

  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const categories = [
    { id: "engine", name: "Двигатели" },
    { id: "hydraulic", name: "Гидравлика" },
    { id: "transmission", name: "Трансмиссия" },
    { id: "brakes", name: "Тормозная система" },
    { id: "electrical", name: "Электрика" },
    { id: "steering", name: "Рулевое управление" },
    { id: "suspension", name: "Подвеска" },
    { id: "wheels", name: "Колеса и шины" },
    { id: "body", name: "Кузов и кабина" },
    { id: "forks", name: "Вилы и грузозахват" },
    { id: "consumables", name: "Расходные материалы" }
  ];

  const brands = [...new Set(products.map(p => p.brand))];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 neon-text">Каталог запчастей</h1>
        
        {/* Discount Banner for Approved Users */}
        {isApproved && !isAdmin && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2">🎉 Скидка {getDiscountPercentage()}% для одобренных пользователей!</h2>
            <p>Все цены указаны с учетом скидки</p>
          </div>
        )}

        {/* Approval Pending Banner */}
        {!isApproved && !isAdmin && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2">⏳ Ваш аккаунт ожидает одобрения</h2>
            <p>После одобрения администратором вы получите доступ к специальным ценам</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Фильтры */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Фильтры</h2>
              
              {/* Поиск */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Поиск</label>
                <input
                  type="text"
                  placeholder="Название, описание, артикул..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Категории */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Категория</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                >
                  <option value="">Все категории</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Бренды */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Бренд</label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                >
                  <option value="">Все бренды</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Цена */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Цена</label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                >
                  <option value="">Любая цена</option>
                  <option value="0-1000">До 1,000 ₽</option>
                  <option value="1000-5000">1,000 - 5,000 ₽</option>
                  <option value="5000-10000">5,000 - 10,000 ₽</option>
                  <option value="10000-20000">10,000 - 20,000 ₽</option>
                  <option value="20000-50000">20,000 - 50,000 ₽</option>
                  <option value="50000-">От 50,000 ₽</option>
                </select>
              </div>

              {/* Наличие */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Наличие</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                >
                  <option value="">Любое количество</option>
                  <option value="1-5">1-5 шт</option>
                  <option value="5-10">5-10 шт</option>
                  <option value="10-20">10-20 шт</option>
                  <option value="20-">От 20 шт</option>
                </select>
              </div>

              {/* Товаров на странице */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Товаров на странице</label>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Сброс фильтров */}
              <button
                onClick={() => {
                  setFilter("");
                  setBrandFilter("");
                  setPriceFilter("");
                  setStockFilter("");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>

          {/* Товары */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg">
                Найдено товаров: <span className="font-bold text-cyan-400">{filteredProducts.length}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentProducts.map(product => (
                <div key={product.id} className="bg-[#1e293b] rounded-xl p-6 shadow-lg hover:scale-105 transition">
                  <div className="w-full h-48 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{product.brand}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-gray-300 text-sm mb-2 line-clamp-2">{product.desc}</p>
                  <p className="text-cyan-300 text-sm mb-2">Артикул: {product.sku}</p>
                  <p className="text-cyan-300 text-sm mb-4">Каталог: {product.catalogNumber}</p>
                  
                  <div className="flex items-center justify-between mb-4">
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
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.stock > 10 ? 'bg-green-500 text-white' : 
                      product.stock > 0 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {product.stock > 0 ? `${product.stock} шт` : 'Нет в наличии'}
                    </span>
                  </div>
                  
                  <Link
                    href={`/product/${product.id}`}
                    className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold text-center transition block"
                  >
                    Подробнее
                  </Link>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 rounded-lg text-white font-semibold transition"
                >
                  ←
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      currentPage === page 
                        ? 'bg-cyan-500 text-white' 
                        : 'bg-[#1e293b] text-white hover:bg-cyan-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 rounded-lg text-white font-semibold transition"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 