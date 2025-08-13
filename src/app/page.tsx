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

  // Load site settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Loading site settings...');
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        console.log('Settings response:', data);
        
        if (data.success && data.settings && data.settings.siteName) {
          console.log('Setting site name to:', data.settings.siteName);
          setSiteName(data.settings.siteName.toUpperCase());
        } else {
          console.log('No site name found in settings, using default');
          setSiteName('BILAL-PARTS');
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
        setSiteName('BILAL-PARTS');
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching products...');
        const productsRes = await fetch('/api/products');
        console.log('Products response status:', productsRes.status);
        
        const productsData = await productsRes.json();
        console.log('Products data:', productsData);
        
        // Check if response has success and data properties (new API format)
        if (productsData.success && Array.isArray(productsData.data)) {
          setProducts(productsData.data);
          console.log(`Loaded ${productsData.data.length} products`);
          // Debug: Check first few products for salePrice values
          if (productsData.data.length > 0) {
            console.log('First 3 products salePrice values:', productsData.data.slice(0, 3).map((p: any) => ({
              name: p.name,
              price: p.price,
              salePrice: p.salePrice
            })));
          }
        } else if (Array.isArray(productsData)) {
          // Fallback for old API format
          setProducts(productsData);
          console.log(`Loaded ${productsData.length} products`);
          // Debug: Check first few products for salePrice values
          if (productsData.length > 0) {
            console.log('First 3 products salePrice values:', productsData.slice(0, 3).map((p: any) => ({
              name: p.name,
              price: p.price,
              salePrice: p.salePrice
            })));
          }
        } else {
          console.error('Products data is not in expected format:', productsData);
          setProducts([]);
        }
        
        const categoriesRes = await fetch('/api/categories');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          // Check if response has success and data properties (new API format)
          if (categoriesData.success && Array.isArray(categoriesData.data)) {
            setCategories(categoriesData.data);
          } else if (Array.isArray(categoriesData)) {
            // Fallback for old API format
            setCategories(categoriesData);
          } else {
            setCategories([]);
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

  const toggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в систему для добавления товаров в избранное');
      return;
    }
    
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      
      if (response.ok) {
        setWishlist(prev => 
          prev.includes(productId) 
            ? prev.filter(id => id !== productId)
            : [...prev, productId]
        );
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
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
    // Debug: Log product price info
    console.log('ProductCard render:', {
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      isAuthenticated,
      isApproved,
      userDiscount: user?.discountPercentage
    });
    
    return (
      <div className="bg-[#1e293b] rounded-lg p-3 hover:bg-cyan-900 transition-all duration-300 hover:scale-105 flex flex-col h-96 cursor-pointer group relative">
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />
        <div className="w-full h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md mb-3 flex items-center justify-center overflow-hidden flex-shrink-0">
          {product.images && product.images.length > 0 && product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : null}
          <span className="text-white font-bold text-sm" style={{ display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex' }}>{product.brand || product.name}</span>
        </div>
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="min-h-0 flex-1 flex flex-col">
            <div className="font-semibold text-base mb-3 text-center leading-tight overflow-hidden" style={{ minHeight: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</div>
                                <div className="text-center mb-4">
                      {isAuthenticated && isApproved && user && user.discountPercentage > 0 ? (
                        <div>
                          <div className="text-gray-400 line-through text-sm">{product.price?.toLocaleString()}₼</div>
                          <div className="text-cyan-400 font-bold text-lg">{calculateDiscountedPrice(product.price, product.salePrice)?.toFixed(2)}₼</div>
                        </div>
                      ) : (
                        <div className="text-cyan-400 font-bold text-lg">{product.price?.toLocaleString()}₼</div>
                      )}
                    </div>
            <div className="text-xs text-gray-400 text-center space-y-1 mb-6">
              <div className="truncate">{product.category?.name || '-'}</div>
              <div className="truncate">Artikul: {product.artikul || product.sku || '-'}</div>
              {product.salesCount && (
                <div className="truncate">{t('sales_count')}: {product.salesCount}</div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-center mt-auto pt-6 relative z-20">
            <button
              onClick={e => { 
                e.stopPropagation(); 
                e.preventDefault(); 
                // Use product.id directly for database lookup, fallback to name-based mapping
                const productId = product.id || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                onAddToCart(productId, 1); 
              }}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-white text-xs font-semibold text-center transition"
            >
              Add to Cart
            </button>
            <button
              onClick={e => { e.stopPropagation(); e.preventDefault(); onToggleWishlist(product.id); }}
              className={`px-4 py-2 rounded text-white text-xs transition ${isWishlisted ? 'bg-red-500' : 'bg-white/10 hover:bg-red-500'}`}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
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
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-2xl">Загрузка...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 neon-text">
            {siteName}
          </h1>
          <p className="text-xl mb-8 text-gray-300">
            Запчасти для вилочных погрузчиков в Москве
          </p>
          <p className="text-lg mb-8 text-gray-400">
            Интернет-магазин премиум-класса
          </p>
          <Link 
            href="/catalog" 
            className="px-8 py-4 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-xl transition"
          >
            Перейти в каталог
          </Link>
        </section>

        {/* Categories Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Категории товаров</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 8).map((category) => (
              <Link 
                key={category.id} 
                href={`/catalog?category=${category.id}`}
                className="bg-white/10 rounded-lg p-6 text-center hover:bg-white/20 transition group"
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
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <p className="text-sm text-gray-400">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Sellers Section */}
        {topSellers.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Топ продаж</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getTopSellersProducts().map((product) => {
                const translatedProduct = translateProductData(product);
                return (
                  <div key={product.id} className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition">
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="relative mb-4">
                        {translatedProduct.images && translatedProduct.images.length > 0 ? (
                          <Image
                            src={translatedProduct.images[0]}
                            alt={translatedProduct.name}
                            width={200}
                            height={200}
                            className="w-full h-48 object-cover rounded-lg cursor-pointer"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-600 rounded-lg flex items-center justify-center cursor-pointer">
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
                              : 'bg-white/20 text-white hover:bg-white/30'
                          } transition`}
                        >
                          {wishlist.includes(product.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 cursor-pointer hover:text-cyan-300 transition">{translatedProduct.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">Артикул: {translatedProduct.sku}</p>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          {isApproved && user && user.discountPercentage > 0 ? (
                            <div>
                              <span className="line-through text-gray-400 text-sm">
                                {translatedProduct.price.toLocaleString()} ₽
                              </span>
                              <span className="text-green-400 ml-2 font-semibold">
                                {calculateDiscountedPrice(translatedProduct.price, null).toLocaleString()} ₽
                              </span>
                            </div>
                          ) : (
                            <span className="text-xl font-bold">
                              {translatedProduct.price.toLocaleString()} ₽
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          Продано: {topSellers.find(s => s.productId === product.id)?.salesCount || 0}
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleAddToCart(translatedProduct)}
                      className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition"
                    >
                      Добавить в корзину
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Latest Products Section */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Новые поступления</h2>
            <button
              onClick={() => setShowAllLatestProducts(!showAllLatestProducts)}
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              {showAllLatestProducts ? 'Показать меньше' : 'Показать все'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getLatestProducts().map((product) => {
              const translatedProduct = translateProductData(product);
              return (
                <div key={product.id} className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition">
                  <Link href={`/product/${product.id}`} className="block">
                    <div className="relative mb-4">
                      {translatedProduct.images && translatedProduct.images.length > 0 ? (
                        <Image
                          src={translatedProduct.images[0]}
                          alt={translatedProduct.name}
                          width={200}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-600 rounded-lg flex items-center justify-center cursor-pointer">
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
                            : 'bg-white/20 text-white hover:bg-white/30'
                        } transition`}
                      >
                        {wishlist.includes(product.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 cursor-pointer hover:text-cyan-300 transition">{translatedProduct.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">Артикул: {translatedProduct.sku}</p>
                    <div className="mb-4">
                      {isApproved && user && user.discountPercentage > 0 ? (
                        <div>
                          <span className="line-through text-gray-400 text-sm">
                            {translatedProduct.price.toLocaleString()} ₽
                          </span>
                          <span className="text-green-400 ml-2 font-semibold">
                            {calculateDiscountedPrice(translatedProduct.price, null).toLocaleString()} ₽
                          </span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold">
                          {translatedProduct.price.toLocaleString()} ₽
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleAddToCart(translatedProduct)}
                    className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition"
                  >
                    Добавить в корзину
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Почему выбирают нас</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2">Быстрая доставка</h3>
              <p className="text-gray-400">Доставка по Москве в течение 24 часов</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">Гарантия качества</h3>
              <p className="text-gray-400">Все товары с гарантией производителя</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Лучшие цены</h3>
              <p className="text-gray-400">Конкурентные цены на все товары</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
