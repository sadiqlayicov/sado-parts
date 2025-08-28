'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { t } = useTranslation();
  const { cartItemsCount } = useCart();
  const { user, isAuthenticated, isRegistered, isApproved, isAdmin, login, register, logout, getDiscountPercentage, refreshUserStatus, clearCachedData } = useAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  
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
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const wishlistRef = useRef<HTMLDivElement>(null);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load site logo from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLogo = localStorage.getItem('siteLogo');
      if (storedLogo) {
        setSiteLogo(storedLogo);
      }
    }
  }, []);

  // LocalStorage dəyişəndə və ya başqa tabda dəyişiklik olduqda wishlist-i yenilə
  useEffect(() => {
    function updateWishlist() {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
        // console.log('Wishlist updated from localStorage:', stored); // Debug mesajını gizlət
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

  // Fetch wishlist products when wishlist changes
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      console.log('Fetching wishlist products for:', wishlist);
      
      if (wishlist.length === 0) {
        setWishlistProducts([]);
        setWishlistLoading(false);
        return;
      }

      setWishlistLoading(true);
      try {
        // Use GET method with query parameters
        const idsParam = wishlist.join(',');
        console.log('Making request to batch API with IDs:', idsParam);
        
        const response = await fetch(`/api/products/batch?ids=${encodeURIComponent(idsParam)}`);

        if (response.ok) {
          const data = await response.json();
          console.log('Batch API response:', data);
          
          // The API returns the products directly as an array
          if (Array.isArray(data)) {
            console.log('Setting wishlist products:', data.length, 'products');
            setWishlistProducts(data);
          } else {
            console.error('Unexpected response format:', data);
            setWishlistProducts([]);
          }
        } else {
          console.error('Failed to fetch wishlist products:', response.status);
          setWishlistProducts([]);
        }
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
        setWishlistProducts([]);
      } finally {
        setWishlistLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist]);

  // Close wishlist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wishlistRef.current && !wishlistRef.current.contains(event.target as Node)) {
        setShowWishlist(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  // Function to render categories in grid format for header
  const renderCategoriesForHeader = (cats: any[]): React.ReactElement[] => {
    // Filter out subcategories, only show main categories
    const mainCategories = cats.filter(category => 
      !category.parentId && 
      !category.name.toLowerCase().includes('test') && 
      category.name && 
      category.name.trim() !== '' && 
      category.name.length > 0 &&
      category.name !== 'undefined' &&
      category.name !== 'null' &&
      category.name !== '' &&
      category.name !== ' ' &&
      category.name !== '  ' &&

      category.id && 
      category.id !== null &&
      category.id !== undefined
    );
    
    // Debug: log filtered categories
    console.log('All categories:', cats.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })));
    console.log('Filtered categories:', mainCategories.map(c => ({ id: c.id, name: c.name })));
    console.log('Categories count:', mainCategories.length);
    
    const getCategoryIcon = (categoryName: string) => {
      const name = categoryName.toLowerCase();
      if (name.includes('engine')) return '⚙️';
      if (name.includes('transmission') || name.includes('transmissiya')) return '⚙️';
      if (name.includes('brake') || name.includes('əyləc')) return '⭕';
      if (name.includes('hydraulic') || name.includes('hidravlika')) return '💧';
      if (name.includes('electrical') || name.includes('elektrik')) return '⚡';
      if (name.includes('tire') || name.includes('wheel')) return '⭕';
      if (name.includes('filter')) return '🔍';
      if (name.includes('body')) return '⬜';
      if (name.includes('cooling')) return '❄️';
      if (name.includes('steering')) return '⭕';
      if (name.includes('chassis')) return '⬜';
      if (name.includes('mast')) return '📏';
      if (name.includes('drive')) return '🔗';
      if (name.includes('dizel')) return '🔥';
      if (name.includes('forklift')) return '⬜';
      return '📦';
    };

    return mainCategories.map((category, index) => (
      <div key={category.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <Link
            href={`/catalog?category=${category.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#374151',
              textDecoration: 'none',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              minWidth: '85px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e9ecef';
            e.currentTarget.style.borderColor = '#dee2e6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.borderColor = '#e9ecef';
          }}
          onClick={() => setShowCategories(false)}
        >
          <span style={{ fontSize: '18px', marginBottom: '6px', color: '#6c757d' }}>
            {getCategoryIcon(category.name)}
          </span>
          <span style={{ fontSize: '11px', lineHeight: '1.2', fontWeight: '500', color: '#495057' }}>
            {category.name.length > 12 ? category.name.substring(0, 12) + '...' : category.name}
          </span>
        </Link>
        {index < mainCategories.length - 1 && (
          <div style={{ 
            width: '1px', 
            height: '40px', 
            backgroundColor: '#dee2e6', 
            margin: '0 4px' 
          }} />
        )}
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
    <header className="bg-white text-gray-800 shadow-md sticky top-0 z-50 font-sans">
      {/* Main Header */}
      <div className="w-full px-2 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and Company Name - Very Far Left */}
          <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
            <Link href="/" className="flex items-center space-x-4">
              {siteLogo ? (
                <img 
                  src={siteLogo} 
                  alt="Site Logo" 
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">B</span>
                </div>
              )}
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-900 tracking-wide font-sans">BILAL-PARTS</div>
                <div className="text-sm text-gray-600 font-medium mt-1 font-sans">Запчасти для погрузчиков</div>
              </div>
            </Link>
          </div>

          {/* Navigation - Center */}
          <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
            <Link
              href="/"
              className="text-gray-900 hover:text-blue-600 transition font-extrabold text-base font-sans"
            >
              Главная
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
                className="text-gray-900 hover:text-blue-600 transition font-extrabold flex items-center text-base font-sans"
                onClick={() => router.push('/catalog')}
              >
                Каталог
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCategories && (
                <div className="absolute top-full left-0 mt-4 z-50" style={{ marginLeft: '-180px' }}>
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-500 font-sans">Загрузка...</div>
                  ) : categories.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', padding: '12px', justifyContent: 'flex-start', alignItems: 'center', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
                      {renderCategoriesForHeader(categories)}
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500 font-sans">Категории не найдены</div>
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
              <button className="text-gray-900 hover:text-blue-600 transition font-extrabold flex items-center text-base font-sans">
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition font-sans"
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
              className="text-gray-900 hover:text-blue-600 transition font-extrabold text-base font-sans"
            >
              Блог
            </Link>
            <Link
              href="/contacts"
              className="text-gray-900 hover:text-blue-600 transition font-extrabold text-base font-sans"
            >
              Контакты
            </Link>
          </nav>

          {/* Search Bar - Center Right */}
          <div className="hidden lg:flex items-center flex-1 justify-center max-w-md ml-16 mr-4">
            <div className="relative w-full" ref={searchRef}>
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
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-sans"
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
                    <div className="text-sm text-gray-500 mb-3 font-sans">Найдено товаров: {searchResults.length}</div>
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
                          <h4 className="text-sm font-medium text-gray-900 truncate font-sans">{product.name}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.artikul && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-sans">
                                Арт: {product.artikul}
                              </span>
                            )}
                            {product.catalogNumber && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-sans">
                                Кат: {product.catalogNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 font-sans">
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

          {/* User Actions - Right Side */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-blue-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
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
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* User Authentication Icons */}
            <div className="hidden lg:flex items-center space-x-3 ml-3">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="p-2 text-blue-600 hover:text-blue-800 transition"
                      title="Админ панель"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="p-2 text-blue-600 hover:text-blue-800 transition"
                    title="Профиль"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-600 hover:text-red-800 transition"
                    title="Выйти"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="p-2 text-blue-600 hover:text-blue-800 transition"
                    title="Войти"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </Link>
                  <Link
                    href="/register"
                    className="p-2 text-blue-600 hover:text-blue-800 transition"
                    title="Регистрация"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </Link>
                </>
              )}
            </div>

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
                  <div ref={wishlistRef} className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-3">Избранное ({wishlist.length})</div>
            {wishlist.length === 0 ? (
              <div className="text-gray-500 text-sm">Избранное пусто</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {wishlistProducts.length > 0 ? (
                  wishlistProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded hover:bg-gray-100 transition">
                      <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No img</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-sm min-w-0">
                        <div className="text-gray-900 font-medium truncate">{product.name}</div>
                        <div className="text-gray-500 text-xs">
                          {product.artikul && `Артикул: ${product.artikul}`}
                          {product.catalogNumber && product.artikul && ' • '}
                          {product.catalogNumber && `Каталог: ${product.catalogNumber}`}
                        </div>
                        <div className="text-blue-600 font-semibold text-xs">
                          {product.price} ₽
                        </div>
                      </div>
                    </div>
                  ))
                ) : wishlistLoading ? (
                  <div className="text-gray-500 text-sm text-center py-4">
                    Загрузка товаров...
                  </div>
                ) : null}
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