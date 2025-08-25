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

  // Load site settings with caching
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check if settings are cached
        const cachedSettings = localStorage.getItem('siteSettings');
        if (cachedSettings) {
          const settings = JSON.parse(cachedSettings);
          if (settings.siteName) {
            setSiteName(settings.siteName);
            return;
          }
        }

        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        if (data.success && data.settings) {
          const settings = data.settings;
          
          // Update site name
          if (settings.siteName) {
            setSiteName(settings.siteName);
          } else {
            setSiteName('Bilal-Parts');
          }
          
          // Store settings in localStorage for other components to use
          if (typeof window !== 'undefined') {
            localStorage.setItem('siteSettings', JSON.stringify(settings));
            // Cache settings for 5 minutes
            setTimeout(() => localStorage.removeItem('siteSettings'), 5 * 60 * 1000);
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
          }
        } else {
          setSiteName('Bilal-Parts');
        }
      } catch (error) {
        console.error('Header: Error loading site settings:', error);
        setSiteName('Bilal-Parts');
      }
    };

    loadSettings();
    
    // Set up interval to refresh settings every 5 minutes instead of 30 seconds
    const interval = setInterval(loadSettings, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for settings updates from admin panel
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      console.log('Header: Settings updated event received:', event.detail);
      const settings = event.detail;
      if (settings.siteName) {
        setSiteName(settings.siteName);
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    };
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
          className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition ${level > 0 ? 'pl-' + (level * 4 + 4) : ''}`}
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

        const filtered = allProducts.filter((product: any) => 
          product.name?.toLowerCase().includes(query.toLowerCase()) ||
          product.artikul?.toLowerCase().includes(query.toLowerCase()) ||
          product.catalogNumber?.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(filtered.slice(0, 8));
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      const timeoutId = setTimeout(() => performSearch(value), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSearchResultClick = (product: any) => {
    router.push(`/product/${product.id}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    try {
      setIsRefreshing(true);
      await logout();
      clearCachedData();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white text-gray-800 shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-100 py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <span className="text-gray-600">
              <i className="fas fa-phone mr-2"></i>
              +994 50 123 45 67
            </span>
            <span className="text-gray-600">
              <i className="fas fa-envelope mr-2"></i>
              info@bilal-parts.az
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    Админ панель
                  </Link>
                )}
                <span className="text-gray-600">
                  {user?.name || user?.email}
                </span>
                <Link
                  href="/profile"
                  className="text-blue-600 hover:text-blue-800 transition"
                >
                  Профиль
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800 transition"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 transition"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-800 transition"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{siteName}</div>
              <div className="text-sm text-gray-600">Запчасти для погрузчиков</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Главная страница
            </Link>
            
            {/* Categories */}
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
                className="text-gray-700 hover:text-blue-600 transition font-medium flex items-center"
                onClick={() => router.push('/catalog')}
              >
                Каталог
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCategories && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Загрузка...</div>
                  ) : categories.length > 0 ? (
                    renderCategoriesForHeader(categories, 0)
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">Категории не найдены</div>
                  )}
                </div>
              )}
            </div>

            {/* Brands */}
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
              <button className="text-gray-700 hover:text-blue-600 transition font-medium flex items-center">
                Бренды
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showBrands && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 max-h-96 overflow-y-auto z-50"
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
                      onClick={() => setShowBrands(false)}
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/blog"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Блог
            </Link>
            <Link
              href="/contacts"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Контакты
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="relative" ref={searchRef}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    e.preventDefault();
                    router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
                    setShowSearchResults(false);
                  }
                }}
                className="w-64 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
                    setShowSearchResults(false);
                  }
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-3">Найдено товаров: {searchResults.length}</div>
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSearchResultClick(product)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition mb-2"
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.artikul && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Арт: {product.artikul}
                              </span>
                            )}
                            {product.catalogNumber && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Кат: {product.catalogNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {product.price?.toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-blue-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <button
              onClick={() => setShowWishlist(!showWishlist)}
              className="relative p-2 text-gray-700 hover:text-red-500 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-gray-50 border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
                    setShowMobileMenu(false);
                  }
                }}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <nav className="space-y-2">
              <Link
                href="/"
                className="block py-2 text-gray-700 hover:text-blue-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Главная страница
              </Link>
              <Link
                href="/catalog"
                className="block py-2 text-gray-700 hover:text-blue-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Каталог
              </Link>
              <Link
                href="/blog"
                className="block py-2 text-gray-700 hover:text-blue-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Блог
              </Link>
              <Link
                href="/contacts"
                className="block py-2 text-gray-700 hover:text-blue-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Контакты
              </Link>
            </nav>
            <div className="pt-4 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="space-y-2">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block py-2 text-blue-600 hover:text-blue-800 transition"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Админ панель
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="block py-2 text-blue-600 hover:text-blue-800 transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Профиль
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left py-2 text-red-600 hover:text-red-800 transition"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block py-2 text-blue-600 hover:text-blue-800 transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    className="block py-2 text-blue-600 hover:text-blue-800 transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Dropdown */}
      {showWishlist && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-3">Избранное ({wishlist.length})</div>
            {wishlist.length === 0 ? (
              <div className="text-gray-500 text-sm">Избранное пусто</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {wishlist.slice(0, 5).map((item) => (
                  <div key={item} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    <div className="flex-1 text-sm">
                      <div className="text-gray-900">Товар {item}</div>
                      <div className="text-gray-500">ID: {item}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {wishlist.length > 0 && (
              <Link
                href="/wishlist"
                className="block mt-3 text-center py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition"
              >
                Посмотреть все
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 