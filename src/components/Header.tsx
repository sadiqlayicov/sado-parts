'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { t } = useTranslation();
  const { cartItemsCount } = useCart();
  const { user, isAuthenticated, isRegistered, isApproved, isAdmin, login, register, logout, getDiscountPercentage, refreshUserStatus, clearCachedData } = useAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [siteName, setSiteName] = useState('Sado-Parts');
  
  const [showCategories, setShowCategories] = useState(false);
  const [showBrands, setShowBrands] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [categoriesHover, setCategoriesHover] = useState(false);
  let categoriesTimeout: NodeJS.Timeout;
  const categoriesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const brandsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [showWishlist, setShowWishlist] = useState(false);

  // LocalStorage dəyişəndə və ya başqa tabda dəyişiklik olduqda wishlist-i yenilə
  useEffect(() => {
    function updateWishlist() {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(stored);
      }
    }
    window.addEventListener('storage', updateWishlist);
    window.addEventListener('wishlistChanged', updateWishlist);
    updateWishlist(); // Yalnız useEffect-in içində çağırılır
    return () => {
      window.removeEventListener('storage', updateWishlist);
      window.removeEventListener('wishlistChanged', updateWishlist);
    };
  }, []);

  // Load site settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        if (data.success && data.settings && data.settings.siteName) {
          setSiteName(data.settings.siteName);
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
      }
    };

    loadSettings();
  }, []);

  const brands = [
    "Toyota", "Komatsu", "Nissan", "Mitsubishi", "Garrett", "Kawasaki", 
    "Hydraulic", "Transmission", "Brake", "Electrical", "Steering"
  ];

  useEffect(() => {
    async function fetchCategories() {
      try {
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
        } else {
          setCategories([]);
        }
              } catch (error) {
          console.error('Ошибка получения категорий:', error);
          setCategories([]);
        } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Refresh user status when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshUserStatus();
    }
  }, [isAuthenticated, user, refreshUserStatus]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
    }
    if (showCategories) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategories]);



  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24">
          {/* Логотип */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold neon-text">{siteName}</h1>
              <p className="text-xs text-cyan-300">Запчасти для погрузчиков</p>
            </div>
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/">{t('home')}</Link>
            
            {/* Категории */}
            <div
              className="relative"
              ref={categoriesRef}
              onMouseEnter={() => {
                if (categoriesTimeoutRef.current) clearTimeout(categoriesTimeoutRef.current);
                setShowCategories(true);
              }}
              onMouseLeave={() => {
                categoriesTimeoutRef.current = setTimeout(() => setShowCategories(false), 200);
              }}
            >
              <button
                className="hover:text-cyan-300 transition font-semibold flex items-center gap-1"
                onClick={() => router.push('/catalog')}
              >
                {t('catalog')}
                <span className="text-xs">▼</span>
              </button>
              {showCategories && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 bg-[#1e293b] rounded-xl shadow-2xl border border-cyan-500/20 py-2 z-50"
                >
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-400">Загрузка...</div>
                  ) : categories.length > 0 ? (
                    categories.map(category => (
                      <Link
                        key={category.id}
                        href={`/catalog?category=${category.id}`}
                        className="block px-4 py-2 text-sm text-white hover:bg-cyan-600 rounded transition"
                        onClick={() => setShowCategories(false)}
                      >
                        {category.name}
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-400">Kateqoriya tapılmadı</div>
                  )}
                </div>
              )}
            </div>

            {/* Бренды */}
            <div 
              className="relative"
              onMouseEnter={() => {
                if (brandsTimeoutRef.current) clearTimeout(brandsTimeoutRef.current);
                setShowBrands(true);
              }}
              onMouseLeave={() => {
                brandsTimeoutRef.current = setTimeout(() => setShowBrands(false), 200);
              }}
            >
              <button className="hover:text-cyan-300 transition font-semibold flex items-center gap-1">
                {t('brands')}
                <span className="text-xs">▼</span>
              </button>
              {showBrands && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-[#1e293b] rounded-xl shadow-2xl border border-cyan-500/20 py-2 max-h-96 overflow-y-auto z-50"
                  onMouseEnter={() => {
                    if (brandsTimeoutRef.current) clearTimeout(brandsTimeoutRef.current);
                    setShowBrands(true);
                  }}
                  onMouseLeave={() => {
                    brandsTimeoutRef.current = setTimeout(() => setShowBrands(false), 200);
                  }}
                >
                  {brands.map(brand => (
                    <Link
                      key={brand}
                      href={{ pathname: '/catalog', query: { brand: brand } }}
                      className="block px-4 py-2 text-sm text-white hover:bg-cyan-600 rounded transition"
                      onClick={() => setShowBrands(false)}
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/blog" className="hover:text-cyan-300 transition font-semibold">{t('blog')}</Link>
            <Link href="/contacts" className="hover:text-cyan-300 transition font-semibold">{t('contacts')}</Link>
            
            {/* Admin Panel Link */}
            {isAdmin && (
              <Link href="/admin" className="hover:text-cyan-300 transition font-semibold text-yellow-400">
                {t('adminPanel')}
              </Link>
            )}
          </nav>

          {/* Правые элементы */}
          <div className="flex items-center gap-4">
            {/* Пользователь */}
            <div className="relative">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    {user?.name === 'Admin User' && (
                      <button
                        onClick={() => {
                          clearCachedData();
                          alert('Кэш очищен. Пожалуйста, войдите снова.');
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                        title="Очистить кэш"
                      >
                        Очистить кэш
                      </button>
                    )}
                    {isAdmin && (
                      <p className="text-xs text-yellow-400">Администратор</p>
                    )}
                    {isApproved && !isAdmin && getDiscountPercentage() > 0 && (
                      <p className="text-xs text-green-400">Скидка {getDiscountPercentage()}%</p>
                    )}
                    {!isApproved && !isAdmin && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-yellow-400">Ожидает одобрения</p>
                        <button
                          onClick={async () => {
                            setIsRefreshing(true);
                            await refreshUserStatus();
                            setIsRefreshing(false);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                          title="Обновить статус"
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? '⏳' : '🔄'}
                        </button>
                        <button
                          onClick={() => {
                            clearCachedData();
                            alert('Кэш очищен. Пожалуйста, войдите снова.');
                          }}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                          title="Очистить кэш и перелогиниться"
                        >
                          🔄
                        </button>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/profile"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold text-sm transition"
                  >
                    {t('profile')}
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold text-sm transition"
                  >
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold transition"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition"
                  >
                    {t('register', 'Регистрация')}
                  </Link>
                </div>
              )}
            </div>

            {/* Корзина */}
            <Link href="/cart" className="relative">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center hover:bg-cyan-600 transition">
                <span className="text-lg">🛒</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </div>
            </Link>
            {/* Wishlist düyməsi */}
            <button
              onClick={() => router.push('/wishlist')}
              className="relative w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center hover:bg-pink-600 transition"
              title="Wishlist"
            >
              <span className="text-lg">♥</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>


    </header>
  );
} 

// WishlistProductCard komponenti
function WishlistProductCard({ productId, onClose }: { productId: string, onClose: () => void }) {
  const [product, setProduct] = useState<any>(null);
  useEffect(() => {
    async function fetchProduct() {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      }
    }
    fetchProduct();
  }, [productId]);
      if (!product) return <div className="bg-[#232b3b] rounded p-4 text-center">Загрузка...</div>;
  return (
    <div className="bg-[#232b3b] rounded p-4 flex flex-col items-center">
      <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} className="w-20 h-20 object-cover rounded mb-2" />
      <div className="font-semibold text-sm mb-1 text-center">{product.name}</div>
      <div className="text-cyan-400 font-bold text-sm mb-2">{product.price?.toLocaleString()}₼</div>
      <Link href={`/product/${product.id}`} className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 rounded text-white text-xs font-semibold text-center transition mb-1" onClick={onClose}>
        Ətraflı
      </Link>
    </div>
  );
} 