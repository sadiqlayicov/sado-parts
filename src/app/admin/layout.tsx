'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaCreditCard,
  FaChartBar,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaHome,
  FaStar,
  FaTruck,
  FaGlobe,
  FaFileExcel,
  FaDatabase,
  FaShieldAlt,
  FaExchangeAlt
} from 'react-icons/fa';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Новый заказ #1234', type: 'order', time: '2 мин назад' },
    { id: 2, message: 'Новый пользователь зарегистрирован', type: 'user', time: '5 мин назад' },
    { id: 3, message: 'Низкий остаток товара "Поршень двигателя"', type: 'stock', time: '10 мин назад' }
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Главная', href: '/admin', icon: FaHome },
    { name: 'Пользователи', href: '/admin/users', icon: FaUsers },
    { name: 'Товары', href: '/admin/products', icon: FaBox },
    { name: 'Категории', href: '/admin/categories', icon: FaBox },
    { name: 'Заказы', href: '/admin/orders', icon: FaShoppingCart },
    { name: 'Платежи', href: '/admin/payments', icon: FaCreditCard },
    { name: 'Отзывы', href: '/admin/reviews', icon: FaStar },
    { name: 'Доставка', href: '/admin/shipping', icon: FaTruck },
    { name: 'Маркетплейсы', href: '/admin/marketplaces', icon: FaGlobe },
    { name: 'Импорт/Экспорт', href: '/admin/import-export', icon: FaFileExcel },
    { name: '1C Интеграция', href: '/admin/1c-integration', icon: FaExchangeAlt },
    { name: 'Аналитика', href: '/admin/analytics', icon: FaChartBar },
    { name: 'Настройки', href: '/admin/settings', icon: FaCog },
    { name: 'Безопасность', href: '/admin/security', icon: FaShieldAlt },
    { name: 'База данных', href: '/admin/database', icon: FaDatabase },
  ];

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar (desktop only) */}
      <aside className="hidden lg:block fixed top-0 left-0 w-64 h-screen z-[50] bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Админ панель</h1>
          <div className="flex items-center space-x-2">
            {/* Notification button */}
            <div className="relative">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <FaBell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <FaSignOutAlt className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav className="mt-8 px-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[99] bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed top-0 left-0 w-64 h-screen bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Админ панель</h1>
              <div className="flex items-center space-x-2">
                {/* Notification button */}
                <div className="relative">
                  <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <FaBell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                </div>
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <FaSignOutAlt className="h-4 w-4" />
                </button>
                {/* Close button */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="mt-8 px-6">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 p-6">
        {/* Mobile hamburger menu */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {children}
      </main>
    </div>
  );
} 