'use client';

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const { isApproved, isAdmin, calculateDiscountedPrice, getDiscountPercentage } = useAuth();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    }
    return [];
  });

  // Filter states
  const [filter, setFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Memoized URL update function
  const updateURL = useCallback((newFilters: any) => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.brand) params.set('brand', newFilters.brand);
    if (newFilters.search) params.set('search', newFilters.search);
    
    const newURL = params.toString() ? `?${params.toString()}` : '/catalog';
    router.push(newURL, { scroll: false });
  }, [router]);

  // Memoized filter change handler
  const handleFilterChange = useCallback((type: string, value: string) => {
    switch (type) {
      case 'category':
        setFilter(value);
        updateURL({ category: value, brand: brandFilter, search: searchQuery });
        break;
      case 'brand':
        setBrandFilter(value);
        updateURL({ category: filter, brand: value, search: searchQuery });
        break;
      case 'search':
        setSearchQuery(value);
        updateURL({ category: filter, brand: brandFilter, search: value });
        break;
    }
    setCurrentPage(1);
  }, [filter, brandFilter, searchQuery, updateURL]);

  // Memoized reset filters function
  const resetFilters = useCallback(() => {
    setFilter("");
    setBrandFilter("");
    setPriceFilter("");
    setStockFilter("");
    setSearchQuery("");
    setCurrentPage(1);
    router.push('/catalog', { scroll: false });
  }, [router]);

  // Memoized fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get category from URL params
      const cat = searchParams.get("category");
      const url = cat ? `/api/products?categoryId=${cat}` : '/api/products';
      
      // Use Promise.all for parallel requests
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(url, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch('/api/categories', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      // Set products
      if (productsData.success && Array.isArray(productsData.data)) {
        setProducts(productsData.data);
      } else if (Array.isArray(productsData)) {
        setProducts(productsData);
      } else {
        setProducts([]);
      }

      // Set categories
      if (categoriesData.success && Array.isArray(categoriesData.data)) {
        setCategories(categoriesData.data);
      } else if (Array.isArray(categoriesData)) {
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
  }, [searchParams]);

  // Fetch data effect
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update filter states from URL params
  useEffect(() => {
    const cat = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");

    setFilter(cat || "");
    setBrandFilter(brand || "");
    setSearchQuery(search || "");
  }, [searchParams]);

  // Memoized wishlist management
  const handleWishlist = useCallback((id: string) => {
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
  }, []);

  // Memoized render categories for select
  const renderCategoriesForSelect = useCallback((cats: any[], level: number): React.ReactElement[] => {
    return cats.flatMap((cat) => [
      <option key={cat.id} value={cat.id}>
        {`${'—'.repeat(level)}${cat.name}`}
      </option>,
      ...(cat.children && cat.children.length > 0 ? renderCategoriesForSelect(cat.children, level + 1) : [])
    ]);
  }, []);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    // If a category is selected via URL params, don't do additional client-side filtering
    // because the API already returns the correct filtered products
    const cat = searchParams.get("category");
    
    if (cat) {
      // Category is already filtered by API, only apply other filters
      return products.filter((product: any) => {
        const matchesBrand = !brandFilter || product.brand === brandFilter;
        
        const matchesSearch = !searchQuery || 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
        
        return matchesBrand && matchesSearch && matchesPrice && matchesStock;
      });
    } else {
      // No category selected, apply all filters including category
      return products.filter((product: any) => {
        // Category filtering - check by ID first, then by name
        const matchesCategory = !filter || 
          product.categoryId === filter || 
          product.category?.id === filter || 
          product.category?.name === filter;
        
        const matchesBrand = !brandFilter || product.brand === brandFilter;
        
        const matchesSearch = !searchQuery || 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
    }
  }, [products, filter, brandFilter, searchQuery, priceFilter, stockFilter, searchParams]);

  // Memoized pagination
  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Memoized unique brands
  const brands = useMemo(() => {
    return [...new Set(products.map((p: any) => p.brand).filter(Boolean))];
  }, [products]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-gray-600">Загрузка...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          {searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Каталог запчастей'}
        </h1>
        
        {searchQuery && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-lg text-gray-700">
              Найдено товаров: <span className="font-bold text-blue-600">{filteredProducts.length}</span>
              {filteredProducts.length > 0 && (
                <span className="ml-4">
                  <button 
                    onClick={() => handleFilterChange('search', '')}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition"
                  >
                    Очистить поиск
                  </button>
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Discount Banner for Approved Users */}
        {isApproved && !isAdmin && getDiscountPercentage() > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2 text-green-800">🎉 Скидка {getDiscountPercentage()}% для одобренных пользователей!</h2>
            <p className="text-green-700">Все цены указаны с учетом скидки</p>
          </div>
        )}

        {/* Approval Pending Banner */}
        {!isApproved && !isAdmin && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2 text-yellow-800">⏳ Ваш аккаунт ожидает одобрения</h2>
            <p className="text-yellow-700">После одобрения администратором вы получите доступ к специальным ценам</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Фильтры */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Фильтры</h2>
              
              {/* Поиск */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Поиск</label>
                <input
                  type="text"
                  placeholder="Название, описание, артикул..."
                  value={searchQuery}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Категории */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Категория</label>
                <select
                  value={filter}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-blue-500 outline-none"
                >
                  <option value="">Все категории</option>
                  {renderCategoriesForSelect(categories, 0)}
                </select>
              </div>

              {/* Бренды */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Бренд</label>
                <select
                  value={brandFilter}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-blue-500 outline-none"
                >
                  <option value="">Все бренды</option>
                  {brands.map((brand, idx) => (
                    <option key={brand || idx} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Цена */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Цена</label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-blue-500 outline-none"
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
                <label className="block text-sm font-semibold mb-2 text-gray-700">Наличие</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-blue-500 outline-none"
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
                <label className="block text-sm font-semibold mb-2 text-gray-700">Товаров на странице</label>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-blue-500 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Сброс фильтров */}
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>

          {/* Товары */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg text-gray-700">
                Найдено товаров: <span className="font-bold text-blue-600">{filteredProducts.length}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {currentProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg p-4 shadow-lg hover:scale-105 transition relative group cursor-pointer border border-gray-200 hover:border-blue-300">
                  <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" />
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative z-20">
                    {product.images && product.images.length > 0 && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <span className="text-gray-600 font-bold text-sm" style={{ display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex' }}>
                      {product.brand || product.name}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900">{product.name}</h3>
                  <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
                  <p className="text-blue-600 text-xs mb-1">Арт: {product.artikul || product.sku || '-'}</p>
                  <p className="text-blue-600 text-xs mb-1">Кат: {product.category?.name || '-'}</p>
                  <p className="text-blue-600 text-xs mb-3">Код: {product.catalogNumber || '-'}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      {isApproved && !isAdmin && getDiscountPercentage() > 0 ? (
                        <>
                          <span className="text-sm text-gray-500 line-through">{product.price.toLocaleString()} ₽</span>
                          <span className="text-lg font-bold text-green-600">{calculateDiscountedPrice(product.price, product.salePrice).toLocaleString()} ₽</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-blue-600">{product.price.toLocaleString()} ₽</span>
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
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-center transition text-xs"
                    >
                      В корзину
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); e.preventDefault(); handleWishlist(product.id); }}
                      className={`px-3 py-1 rounded-lg text-white font-semibold text-center transition text-xs ${wishlist.includes(product.id) ? 'bg-red-500' : 'bg-gray-500 hover:bg-red-500'}`}
                      title={wishlist.includes(product.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      ♥
                    </button>
                  </div>
                  <Link
                    href={`/product/${product.id}`}
                    className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-center transition block mt-2 z-20 relative text-xs"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg text-white font-semibold transition"
                >
                  ←
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg text-white font-semibold transition"
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