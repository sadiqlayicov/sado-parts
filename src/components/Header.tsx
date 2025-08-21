'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  const [siteName, setSiteName] = useState('');
  
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

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    updateWishlist();
    return () => {
      window.removeEventListener('storage', updateWishlist);
      window.removeEventListener('wishlistChanged', updateWishlist);
    };
  }, []);

  // Load site settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Header: Loading site settings...');
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        console.log('Header: Settings response:', data);
        
        if (data.success && data.settings && data.settings.siteName) {
          console.log('Header: Setting site name to:', data.settings.siteName);
          setSiteName(data.settings.siteName);
        } else {
          console.log('Header: No site name found in settings, using default');
          setSiteName('Bilal-Parts');
        }
      } catch (error) {
        console.error('Header: Error loading site settings:', error);
        setSiteName('Bilal-Parts');
      }
    };

    loadSettings();
    
    // Set up interval to refresh settings every 30 seconds
    const interval = setInterval(loadSettings, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const brands = [
    "Toyota", "Komatsu", "Nissan", "Mitsubishi", "Garrett", "Kawasaki", 
    "Hydraulic", "Transmission", "Brake", "Electrical", "Steering"
  ];

  // Recursive function to render categories with hierarchy for header
  const renderCategoriesForHeader = (cats: any[], level: number): React.ReactElement[] => {
    return cats.map((category) => (
      <div key={category.id}>
        <Link
          href={`/catalog?category=${category.id}`}
          className={`block px-4 py-2 text-sm text-white hover:bg-cyan-600 rounded transition ${level > 0 ? 'pl-' + (level * 4 + 4) : ''}`}
          onClick={() => setShowCategories(false)}
        >
          {level > 0 && '└─ '}{category.name}
        </Link>
        {category.children && category.children.length > 0 && renderCategoriesForHeader(category.children, level + 1)}
      </div>
    ));
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categoriesRes = await fetch('/api/categories');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          if (categoriesData.success && Array.isArray(categoriesData.data)) {
            setCategories(categoriesData.data);
          } else if (Array.isArray(categoriesData)) {
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

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        let allProducts = [];
        
        if (data.success && Array.isArray(data.data)) {
          allProducts = data.data;
        } else if (Array.isArray(data)) {
          allProducts = data;
        }
        
        const filteredProducts = allProducts.filter((product: any) => 
          product.name?.toLowerCase().includes(query.toLowerCase()) ||
          product.sku?.toLowerCase().includes(query.toLowerCase()) ||
          product.artikul?.toLowerCase().includes(query.toLowerCase()) ||
          product.catalogNumber?.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        
        setSearchResults(filteredProducts);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle click outside search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchResultClick = (product: any) => {
    setShowSearchResults(false);
    setSearchQuery('');
    router.push(`/product/${product.id}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

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
      <div className="w-full px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-24">
          {/* Логотип - Sol küncdə */}
          <Link href="/" className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-cyan-500 rounded-lg lg:rounded-xl flex items-center justify-center">
              <span className="text-lg lg:text-2xl font-bold">S</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-2xl font-bold neon-text">{siteName}</h1>
              <p className="text-xs text-cyan-300">Запчасти для погрузчиков</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-sm font-bold neon-text">{siteName}</h1>
            </div>
          </Link>

          {/* Поиск - Mərkəzdə geniş */}
          <div className="hidden lg:flex flex-1 max-w-4xl mx-4 relative" ref={searchRef}>
            <div className="relative w-full">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск товаров, артикулов, каталогов..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full px-4 py-3 pl-12 pr-12 bg-[#0f172a] text-white placeholder-gray-300 border border-cyan-500/20 focus:border-cyan-500 outline-none rounded-lg font-medium text-base"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                {searchLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                ) : (
                  <svg className="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-300 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Результаты поиска */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] rounded-xl shadow-2xl border border-cyan-500/20 py-2 max-h-96 overflow-y-auto z-50 min-w-[400px]">
                <div className="text-sm text-gray-400 px-4 py-2 border-b border-gray-600">
                  Найдено товаров: {searchResults.length}
                </div>
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSearchResultClick(product)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-cyan-600/20 cursor-pointer transition border-b border-gray-700 last:border-b-0"
                  >
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-lg"
                          unoptimized
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.sku && (
                          <span className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded">
                            SKU: {product.sku}
                          </span>
                        )}
                        {product.artikul && (
                          <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                            Арт: {product.artikul}
                          </span>
                        )}
                        {product.catalogNumber && (
                          <span className="text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded">
                            Кат: {product.catalogNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {product.price?.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Нет результатов */}
            {showSearchResults && searchQuery && searchResults.length === 0 && !searchLoading && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] rounded-xl shadow-2xl border border-cyan-500/20 py-4 z-50">
                <div className="text-center text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>Товар не найден</p>
                  <p className="text-sm">Попробуйте изменить запрос</p>
                </div>
              </div>
            )}
          </div>

          {/* Навигация */}
          <nav className="hidden lg:flex items-center gap-4">
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
                    renderCategoriesForHeader(categories, 0)
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
          <div className="flex items-center gap-2 lg:gap-2">
            {/* Пользователь */}
            <div className="relative hidden lg:block">
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

            {/* Мобильное меню */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center hover:bg-cyan-600 transition"
              title="Меню"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Быстрый доступ к профилю на мобиле */}
            <Link
              href={isAuthenticated ? '/profile' : '/login'}
              className="lg:hidden w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center hover:bg-cyan-600 transition"
              title={isAuthenticated ? 'Профиль' : 'Войти'}
            >
              <span className="text-sm">👤</span>
            </Link>

            {/* Мобильный поиск */}
            <button
              onClick={() => {
                setShowSearchResults(!showSearchResults);
                if (!showSearchResults) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }
              }}
              className="lg:hidden w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center hover:bg-cyan-600 transition"
              title="Поиск"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Корзина */}
            <Link href="/cart" className="relative">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-cyan-500 rounded-lg flex items-center justify-center hover:bg-cyan-600 transition">
                <span className="text-sm lg:text-lg">🛒</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </div>
            </Link>
            
            {/* Wishlist düyməsi */}
            <button
              onClick={() => router.push('/wishlist')}
              className="relative w-8 h-8 lg:w-10 lg:h-10 bg-pink-500 rounded-lg flex items-center justify-center hover:bg-pink-600 transition"
              title="Wishlist"
            >
              <span className="text-sm lg:text-lg">♥</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      {showMobileMenu && (
        <div className="lg:hidden bg-[#1e293b] border-t border-cyan-500/20 p-3">
          <nav className="space-y-4">
            <Link 
              href="/" 
              className="block px-4 py-2 text-white hover:bg-cyan-600 rounded-lg transition"
              onClick={() => setShowMobileMenu(false)}
            >
              {t('home')}
            </Link>
            
            <div className="space-y-2">
              <div className="px-4 py-2 text-cyan-300 font-semibold">Категории</div>
              {loading ? (
                <div className="px-4 py-2 text-sm text-gray-400">Загрузка...</div>
              ) : categories.length > 0 ? (
                categories.map(category => (
                  <Link
                    key={category.id}
                    href={`/catalog?category=${category.id}`}
                    className="block px-4 py-2 text-sm text-white hover:bg-cyan-600 rounded-lg transition ml-4"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-400 ml-4">Категории не найдены</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="px-4 py-2 text-cyan-300 font-semibold">Бренды</div>
              {brands.map(brand => (
                <Link
                  key={brand}
                  href={{ pathname: '/catalog', query: { brand: brand } }}
                  className="block px-4 py-2 text-sm text-white hover:bg-cyan-600 rounded-lg transition ml-4"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {brand}
                </Link>
              ))}
            </div>

            <Link 
              href="/blog" 
              className="block px-4 py-2 text-white hover:bg-cyan-600 rounded-lg transition"
              onClick={() => setShowMobileMenu(false)}
            >
              {t('blog')}
            </Link>
            
            <Link 
              href="/contacts" 
              className="block px-4 py-2 text-white hover:bg-cyan-600 rounded-lg transition"
              onClick={() => setShowMobileMenu(false)}
            >
              {t('contacts')}
            </Link>

            {isAdmin && (
              <Link 
                href="/admin" 
                className="block px-4 py-2 text-yellow-400 hover:bg-cyan-600 rounded-lg transition"
                onClick={() => setShowMobileMenu(false)}
              >
                {t('adminPanel')}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="space-y-2">
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold text-center transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t('profile')}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link 
                  href="/login" 
                  className="block px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold text-center transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t('login')}
                </Link>
                <Link 
                  href="/register" 
                  className="block px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold text-center transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t('register', 'Регистрация')}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Мобильный поиск */}
      {showSearchResults && (
        <div className="lg:hidden bg-[#1e293b] border-t border-cyan-500/20 p-3">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск товаров, артикулов, каталогов..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="w-full px-3 py-2 pl-8 pr-8 bg-[#0f172a] text-white placeholder-gray-300 border border-cyan-500/20 focus:border-cyan-500 outline-none rounded-lg text-sm"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {searchLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
              ) : (
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Мобильные результаты поиска */}
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-80 overflow-y-auto">
              <div className="text-sm text-gray-400 px-3 py-2 border-b border-gray-600">
                Найдено товаров: {searchResults.length}
              </div>
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSearchResultClick(product)}
                  className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-cyan-600/20 cursor-pointer transition mb-2 border-b border-gray-700 last:border-b-0"
                >
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded-lg"
                        unoptimized
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.sku && (
                        <span className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded">
                          SKU: {product.sku}
                        </span>
                      )}
                      {product.artikul && (
                        <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                          Арт: {product.artikul}
                        </span>
                      )}
                      {product.catalogNumber && (
                        <span className="text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded">
                          Кат: {product.catalogNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {product.price?.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Нет результатов для мобильных */}
          {searchQuery && searchResults.length === 0 && !searchLoading && (
            <div className="mt-4 text-center text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>Товар не найден</p>
              <p className="text-sm">Попробуйте изменить запрос</p>
            </div>
          )}
        </div>
      )}
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
      <Image
        src={product.images?.[0] || '/placeholder.png'}
        alt={product.name}
        width={80}
        height={80}
        className="w-20 h-20 object-cover rounded mb-2"
        unoptimized
      />
      <div className="font-semibold text-sm mb-1 text-center">{product.name}</div>
      <div className="text-cyan-400 font-bold text-sm mb-2">{product.price?.toLocaleString()}₼</div>
      <Link href={`/product/${product.id}`} className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 rounded text-white text-xs font-semibold text-center transition mb-1" onClick={onClose}>
        Ətraflı
      </Link>
    </div>
  );
} 