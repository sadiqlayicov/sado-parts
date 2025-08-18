'use client';

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { Suspense } from "react";
import { useCart } from '../../components/CartProvider';

export default function CatalogPageWrapper() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <CatalogPage />
    </Suspense>
  );
}

function CatalogPage() {
  const searchParams = useSearchParams();
  const { isApproved, isAdmin, calculateDiscountedPrice, getDiscountPercentage } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    }
    return [];
  });

  useEffect(() => {
    function updateWishlist() {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(stored);
      }
    }
    window.addEventListener('storage', updateWishlist);
    window.addEventListener('wishlistChanged', updateWishlist);
    updateWishlist(); // İlk renderdə bir dəfə çağır
    return () => {
      window.removeEventListener('storage', updateWishlist);
      window.removeEventListener('wishlistChanged', updateWishlist);
    };
  }, []);

  const handleWishlist = (id: string) => {
    setWishlist(prev => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter(i => i !== id);
      } else {
        updated = [...prev, id];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(updated));
        window.dispatchEvent(new Event('wishlistChanged'));
      }
      return updated;
    });
  };

  // Recursive function to render categories with hierarchy for select
  const renderCategoriesForSelect = (cats: any[], level: number): React.ReactElement[] => {
    return cats.flatMap((cat) => [
      <option key={cat.id} value={cat.id}>
        {`${'—'.repeat(level)}${cat.name}`}
      </option>,
      ...(cat.children && cat.children.length > 0 ? renderCategoriesForSelect(cat.children, level + 1) : [])
    ]);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        // Check if response has success and data properties (new API format)
        if (productsData.success && Array.isArray(productsData.data)) {
          setProducts(productsData.data);
        } else if (Array.isArray(productsData)) {
          // Fallback for old API format
          setProducts(productsData);
        } else {
          setProducts([]);
        }

        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        // Check if response has success and data properties (new API format)
        if (categoriesData.success && Array.isArray(categoriesData.data)) {
          setCategories(categoriesData.data); // hierarchical tree
        } else if (Array.isArray(categoriesData)) {
          // Fallback for old API format
          setCategories(categoriesData);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Ошибка получения данных:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setFilter(cat);
    const brand = searchParams.get("brand");
    if (brand) setBrandFilter(brand);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const matchesCategory = !filter || product.category?.id === filter || product.category?.name === filter;
      const matchesBrand = !brandFilter || product.brand === brandFilter;
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.desc && product.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
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
  }, [products, filter, brandFilter, searchQuery, priceFilter, stockFilter]);

  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const brands = [...new Set(products.map((p: any) => p.brand))];

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">Загрузка...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 neon-text">Каталог запчастей</h1>
        
        {/* Discount Banner for Approved Users */}
        {isApproved && !isAdmin && getDiscountPercentage() > 0 && (
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
                  <option value="" key="all">Все категории</option>
                  {renderCategoriesForSelect(categories, 0)}
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
                  <option value="" key="all">Все бренды</option>
                  {brands.map((brand, idx) => (
                    <option key={brand || idx} value={brand}>{brand || ""}</option>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {currentProducts.map(product => (
                <div key={product.id} className="bg-[#1e293b] rounded-lg p-4 shadow-lg hover:scale-105 transition relative group cursor-pointer">
                  <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" />
                  <div className="w-full h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative z-20">
                    {product.images && product.images.length > 0 && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <span className="text-white font-bold text-sm" style={{ display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex' }}>
                      {product.brand || product.name}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-gray-300 text-xs mb-2 line-clamp-2">{product.description}</p>
                  <p className="text-cyan-300 text-xs mb-1">Арт: {product.artikul || product.sku || '-'}</p>
                  <p className="text-cyan-300 text-xs mb-1">Кат: {product.category?.name || '-'}</p>
                  <p className="text-cyan-300 text-xs mb-3">Код: {product.catalogNumber || '-'}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      {isApproved && !isAdmin && getDiscountPercentage() > 0 ? (
                        <>
                          <span className="text-sm text-gray-400 line-through">{product.price.toLocaleString()} ₽</span>
                          <span className="text-lg font-bold text-green-400">{calculateDiscountedPrice(product.price, product.salePrice).toLocaleString()} ₽</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-cyan-400">{product.price.toLocaleString()} ₽</span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      product.stock > 10 ? 'bg-green-500 text-white' : 
                      product.stock > 0 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {product.stock > 0 ? `${product.stock} шт` : 'Нет'}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-2 z-20 relative justify-center">
                    <button
                      onClick={e => { e.stopPropagation(); e.preventDefault(); addToCart(product.id, 1); }}
                      className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold text-center transition text-xs"
                    >
                      В корзину
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); e.preventDefault(); handleWishlist(product.id); }}
                      className={`px-3 py-1 rounded-lg text-white font-semibold text-center transition text-xs ${wishlist.includes(product.id) ? 'bg-red-500' : 'bg-white/10 hover:bg-red-500'}`}
                      title={wishlist.includes(product.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      ♥
                    </button>
                  </div>
                  <Link
                    href={`/product/${product.id}`}
                    className="w-full px-3 py-1 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold text-center transition block mt-2 z-20 relative text-xs"
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