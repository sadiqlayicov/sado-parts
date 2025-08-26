'use client';
import { useEffect, useState } from 'react';
import { useCart } from '../components/CartProvider';
import { useAuth } from '../components/AuthProvider';
import Link from 'next/link';
import Image from "next/image";
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { isAuthenticated, isApproved, calculateDiscountedPrice, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [showAllLatestProducts, setShowAllLatestProducts] = useState(false);
  const [siteName, setSiteName] = useState('');

  // Function to translate product names and categories from Azerbaijani to Russian
  const translateProductData = (product: any) => {
    const translations: { [key: string]: string } = {
      // Product names
      'Clark Amortizator dəsti': 'Комплект амортизаторов Clark',
      'Dizel Mühərriklər': 'Дизельные двигатели',
      'Hydraulic Sistem': 'Гидравлическая система',
      'Transmission': 'Трансмиссия',
      'Brake Sistemi': 'Тормозная система',
      'Electrical Sistem': 'Электрическая система',
      'Steering Sistem': 'Рулевое управление',
      'Engine Parts': 'Детали двигателя',
      'Hydraulic Systems': 'Гидравлические системы',
      'Tires & Wheels': 'Шины и колеса',
      'Filters': 'Фильтры',
      'Lubricants': 'Смазочные материалы'
    };

    return {
      ...product,
      name: translations[product.name] || product.name,
      category: product.category ? {
        ...product.category,
        name: translations[product.category.name] || product.category.name
      } : product.category
    };
  };

  // Load site settings with caching
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check if settings are cached
        const cachedSettings = localStorage.getItem('siteSettings');
        if (cachedSettings) {
          const settings = JSON.parse(cachedSettings);
          if (settings.siteName) {
            setSiteName(settings.siteName.toUpperCase());
            return;
          }
        }

        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        if (data.success && data.settings && data.settings.siteName) {
          setSiteName(data.settings.siteName.toUpperCase());
          // Cache settings for 5 minutes
          localStorage.setItem('siteSettings', JSON.stringify(data.settings));
          setTimeout(() => localStorage.removeItem('siteSettings'), 5 * 60 * 1000);
        } else {
          setSiteName('BILAL-PARTS');
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
        setSiteName('BILAL-PARTS');
      }
    };

    loadSettings();
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    function updateWishlist() {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(stored);
      }
    }
    
    updateWishlist();
    window.addEventListener('storage', updateWishlist);
    window.addEventListener('wishlistChanged', updateWishlist);
    
    return () => {
      window.removeEventListener('storage', updateWishlist);
      window.removeEventListener('wishlistChanged', updateWishlist);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Check if products are cached
        const cachedProducts = localStorage.getItem('cachedProducts');
        const cacheTime = localStorage.getItem('productsCacheTime');
        const now = Date.now();
        
        if (cachedProducts && cacheTime && (now - parseInt(cacheTime)) < 10 * 60 * 1000) { // 10 minutes cache
          const productsData = JSON.parse(cachedProducts);
          setProducts(productsData);
          return;
        }

        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        
        // Check if response has success and data properties (new API format)
        if (productsData.success && Array.isArray(productsData.data)) {
          setProducts(productsData.data);
          // Cache products for 10 minutes
          localStorage.setItem('cachedProducts', JSON.stringify(productsData.data));
          localStorage.setItem('productsCacheTime', now.toString());
        } else if (Array.isArray(productsData)) {
          // Fallback for old API format
          setProducts(productsData);
          // Cache products for 10 minutes
          localStorage.setItem('cachedProducts', JSON.stringify(productsData));
          localStorage.setItem('productsCacheTime', now.toString());
        } else {
          setProducts([]);
        }
        
        // Check if categories are cached
        const cachedCategories = localStorage.getItem('cachedCategories');
        const categoriesCacheTime = localStorage.getItem('categoriesCacheTime');
        
        if (cachedCategories && categoriesCacheTime && (now - parseInt(categoriesCacheTime)) < 30 * 60 * 1000) { // 30 minutes cache
          const categoriesData = JSON.parse(cachedCategories);
          setCategories(categoriesData);
        } else {
          const categoriesRes = await fetch('/api/categories');
          if (categoriesRes.ok) {
            const categoriesData = await categoriesRes.json();
            // Check if response has success and data properties (new API format)
            if (categoriesData.success && Array.isArray(categoriesData.data)) {
              setCategories(categoriesData.data);
              // Cache categories for 30 minutes
              localStorage.setItem('cachedCategories', JSON.stringify(categoriesData.data));
              localStorage.setItem('categoriesCacheTime', now.toString());
            } else if (Array.isArray(categoriesData)) {
              // Fallback for old API format
              setCategories(categoriesData);
              // Cache categories for 30 minutes
              localStorage.setItem('cachedCategories', JSON.stringify(categoriesData));
              localStorage.setItem('categoriesCacheTime', now.toString());
            } else {
              setCategories([]);
            }
          }
        }
        
        // Fetch top sellers
        const topSellersRes = await fetch('/api/analytics/top-sellers');
        if (topSellersRes.ok) {
          const topSellersData = await topSellersRes.json();
          if (topSellersData.success && Array.isArray(topSellersData.data)) {
            setTopSellers(topSellersData.data);
          }
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Top satılanlar üçün orderItems-ları yığ
  useEffect(() => {
    let isMounted = true;
    
    async function fetchTopSellers() {
      if (!isMounted) return;
      
      try {
        // İstifadəçi daxil olubsa real orders məlumatlarını istifadə et
        if (isAuthenticated && user?.id) {
          const ordersRes = await fetch(`/api/orders?userId=${user.id}`);
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            if (Array.isArray(ordersData) && isMounted) {
              const allOrderItems = ordersData.flatMap((order: any) => order.items || []);
              // Məhsul üzrə satış miqdarını hesabla
              const salesMap: Record<string, { productId: string, quantity: number }> = {};
              for (const item of allOrderItems) {
                if (!item.productId) continue;
                if (!salesMap[item.productId]) {
                  salesMap[item.productId] = { productId: item.productId, quantity: 0 };
                }
                salesMap[item.productId].quantity += item.quantity || 1;
              }
              // Ən çox satılan 10 məhsulun id-lərini tap
              const topProductIds = Object.values(salesMap)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10)
                .map(x => x.productId);
              // Məhsul məlumatlarını uyğunlaşdır
              const topProducts = products.filter(p => topProductIds.includes(p.id));
              // Satış sayını əlavə et
              const topProductsWithSales = topProducts.map(p => ({
                ...p,
                salesCount: salesMap[p.id]?.quantity || 0
              })).sort((a, b) => b.salesCount - a.salesCount);
              
              if (isMounted) {
                setTopSellers(topProductsWithSales);
                return;
              }
            }
          }
        }
        
        // İstifadəçi daxil olmayıbsa və ya orders məlumatı alına bilməzsə featured məhsulları göstər
        const featuredProducts = products
          .filter(p => p.isFeatured)
          .slice(0, 10)
          .map(p => ({
            ...p,
            salesCount: Math.floor(Math.random() * 50) + 10 // Demo data
          }))
          .sort((a, b) => b.salesCount - a.salesCount);
        
        if (isMounted) {
          setTopSellers(featuredProducts);
        }
      } catch (error) {
        console.error('Error fetching top sellers:', error);
        // Xəta baş verərsə featured məhsulları göstər
        const featuredProducts = products
          .filter(p => p.isFeatured)
          .slice(0, 10)
          .map(p => ({
            ...p,
            salesCount: Math.floor(Math.random() * 50) + 10
          }))
          .sort((a, b) => b.salesCount - a.salesCount);
        
        if (isMounted) {
          setTopSellers(featuredProducts);
        }
      }
    }
    
    if (products.length > 0) {
      fetchTopSellers();
    }
    
    return () => {
      isMounted = false;
    };
  }, [products, isAuthenticated, user?.id]);

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
    setWishlist((prev: string[]) => {
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

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в систему для добавления товаров в корзину');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }
    
    try {
      await addToCart(product.id, 1);
      alert('Товар добавлен в корзину!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Ошибка при добавлении товара в корзину');
    }
  };

  const toggleWishlist = (productId: string) => {
    const updatedWishlist = wishlist.includes(productId)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    
    setWishlist(updatedWishlist);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      window.dispatchEvent(new Event('wishlistChanged'));
    }
  };

  const getLatestProducts = () => {
    return products
      .filter(product => product.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, showAllLatestProducts ? products.length : 8);
  };

  const getTopSellersProducts = () => {
    return products.filter(product => 
      topSellers.some(seller => seller.productId === product.id)
    ).slice(0, 4);
  };

  // Hot Products - son 10 məhsul
  const hotProducts = products.slice(0, 10);

  // Hot Categories - ən çox məhsulu olan kateqoriyalar
  const mostPopularCategories = categories
    .map(cat => ({
      ...cat,
      productCount: products.filter(p => p.categoryId === cat.id).length
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5);

  function ProductCard({ product, onAddToCart, onToggleWishlist, isWishlisted }: any) {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex flex-col h-96 cursor-pointer group relative border border-gray-200">
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />
        <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-lg mb-3 flex items-center justify-center overflow-hidden flex-shrink-0">
          {product.images && product.images.length > 0 && product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : null}
          <span className="text-white font-bold text-sm" style={{ display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex' }}>{product.brand || product.name}</span>
        </div>
        <div className="flex-1 flex flex-col justify-between min-h-0 p-4">
          <div className="min-h-0 flex-1 flex flex-col">
            <div className="font-semibold text-base mb-3 text-center leading-tight overflow-hidden text-gray-900" style={{ minHeight: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</div>
            <div className="text-center mb-4">
              {isAuthenticated && isApproved && user && user.discountPercentage > 0 ? (
                <div>
                  <div className="text-gray-500 line-through text-sm">{product.price?.toLocaleString('ru-RU')} ₽</div>
                  <div className="text-blue-600 font-bold text-lg">{calculateDiscountedPrice(product.price, product.salePrice)?.toFixed(2)} ₽</div>
                </div>
              ) : (
                <div className="text-blue-600 font-bold text-lg">{product.price?.toLocaleString('ru-RU')} ₽</div>
              )}
            </div>
            <div className="text-xs text-gray-600 text-center space-y-1 mb-6">
              <div className="truncate">{product.category?.name || '-'}</div>
              <div className="truncate">Артикул: {product.artikul || product.sku || '-'}</div>
              {product.salesCount && (
                <div className="truncate">Продано: {product.salesCount}</div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-center mt-auto pt-6 relative z-20">
            <button
              onClick={e => { 
                e.stopPropagation(); 
                e.preventDefault(); 
                const productId = product.id || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                onAddToCart(productId, 1); 
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-semibold text-center transition"
            >
              В корзину
            </button>
            <button
              onClick={e => { e.stopPropagation(); e.preventDefault(); onToggleWishlist(product.id); }}
              className={`px-4 py-2 rounded text-white text-xs transition ${isWishlisted ? 'bg-red-500' : 'bg-gray-500 hover:bg-red-500'}`}
              title={isWishlisted ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              ♥
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-gray-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-2xl">Загрузка...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* Hero Banner Section */}
      <section className="relative h-96 lg:h-[500px] bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-blue-700/40 z-20"></div>
        
        {/* Banner Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/banner-promotional.jpg" 
            alt="Professional Technical Support - Bilal Parts" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-30 h-full flex items-center justify-center text-center text-white px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
              {siteName}
            </h1>
            <p className="text-xl lg:text-2xl mb-4 drop-shadow-md">
              Professional Technical Support
            </p>
            <p className="text-lg lg:text-xl mb-8 text-blue-100 drop-shadow-md">
              Powerful Parts Research System & Strong Supply Chain
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/catalog" 
                className="px-8 py-4 rounded-lg bg-white text-blue-600 hover:bg-gray-100 font-semibold text-xl transition shadow-lg"
              >
                Перейти в каталог
              </Link>
              <Link 
                href="/contacts" 
                className="px-8 py-4 rounded-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold text-xl transition"
              >
                Связаться с нами
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Категории товаров</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 8).map((category) => (
              <Link 
                key={category.id} 
                href={`/catalog?category=${category.id}`}
                className="bg-white rounded-lg p-6 text-center hover:bg-blue-50 transition group border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition">
                  {category.name === 'Engine Parts' ? '🔧' :
                   category.name === 'Transmission' ? '⚙️' :
                   category.name === 'Brake System' ? '🛑' :
                   category.name === 'Hydraulic Systems' ? '💧' :
                   category.name === 'Electrical' ? '⚡' :
                   category.name === 'Tires & Wheels' ? '🛞' :
                   category.name === 'Filters' ? '🔍' :
                   category.name === 'Lubricants' ? '🛢️' : '📦'}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Sellers Section */}
        {topSellers.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Топ продаж</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getTopSellersProducts().map((product) => {
                const translatedProduct = translateProductData(product);
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition border border-gray-200">
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="relative mb-4">
                        {translatedProduct.images && translatedProduct.images.length > 0 ? (
                          <Image
                            src={translatedProduct.images[0]}
                            alt={translatedProduct.name}
                            width={200}
                            height={200}
                            className="w-full h-48 object-cover rounded-t-lg cursor-pointer"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center cursor-pointer">
                            <span className="text-4xl">📦</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(product.id);
                          }}
                          className={`absolute top-2 right-2 p-2 rounded-full ${
                            wishlist.includes(product.id) 
                              ? 'bg-red-500 text-white' 
                              : 'bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white'
                          } transition`}
                        >
                          {wishlist.includes(product.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600 transition text-gray-900">{translatedProduct.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">Артикул: {translatedProduct.sku}</p>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            {isApproved && user && user.discountPercentage > 0 ? (
                              <div>
                                <span className="line-through text-gray-500 text-sm">
                                  {translatedProduct.price.toLocaleString()} ₽
                                </span>
                                <span className="text-blue-600 ml-2 font-semibold">
                                  {calculateDiscountedPrice(translatedProduct.price, null).toLocaleString()} ₽
                                </span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold text-blue-600">
                                {translatedProduct.price.toLocaleString()} ₽
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            Продано: {topSellers.find(s => s.productId === product.id)?.salesCount || 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => handleAddToCart(translatedProduct)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition"
                      >
                        Добавить в корзину
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Latest Products Section */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Новые поступления</h2>
            <button
              onClick={() => setShowAllLatestProducts(!showAllLatestProducts)}
              className="text-blue-600 hover:text-blue-700 transition font-semibold"
            >
              {showAllLatestProducts ? 'Показать меньше' : 'Показать все'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getLatestProducts().map((product) => {
              const translatedProduct = translateProductData(product);
              return (
                <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition border border-gray-200">
                  <Link href={`/product/${product.id}`} className="block">
                    <div className="relative mb-4">
                      {translatedProduct.images && translatedProduct.images.length > 0 ? (
                        <Image
                          src={translatedProduct.images[0]}
                          alt={translatedProduct.name}
                          width={200}
                          height={200}
                          className="w-full h-48 object-cover rounded-t-lg cursor-pointer"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center cursor-pointer">
                          <span className="text-4xl">📦</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product.id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full ${
                          wishlist.includes(product.id) 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white'
                        } transition`}
                      >
                        {wishlist.includes(product.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600 transition text-gray-900">{translatedProduct.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">Артикул: {translatedProduct.sku}</p>
                      <div className="mb-4">
                        {isApproved && user && user.discountPercentage > 0 ? (
                          <div>
                            <span className="line-through text-gray-500 text-sm">
                              {translatedProduct.price.toLocaleString()} ₽
                            </span>
                            <span className="text-blue-600 ml-2 font-semibold">
                              {calculateDiscountedPrice(translatedProduct.price, null).toLocaleString()} ₽
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-blue-600">
                            {translatedProduct.price.toLocaleString()} ₽
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleAddToCart(translatedProduct)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition"
                    >
                      Добавить в корзину
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Почему выбирают нас</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Быстрая доставка</h3>
              <p className="text-gray-600">Доставка по Москве в течение 24 часов</p>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Гарантия качества</h3>
              <p className="text-gray-600">Все товары с гарантией производителя</p>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Лучшие цены</h3>
              <p className="text-gray-600">Конкурентные цены на все товары</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
