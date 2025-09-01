'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useNotifications } from '../../components/NotificationProvider';
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
  FaExchangeAlt,
  FaDownload,
  FaImage,
  FaTimes,
  FaCheck,
  FaUser,
  FaShoppingBag
} from 'react-icons/fa';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

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
    { name: 'CommerceML 2.05', href: '/admin/1c-integration', icon: FaExchangeAlt },
    { name: 'Аналитика', href: '/admin/analytics', icon: FaChartBar },
    { name: 'Логотип', href: '/admin/logo-upload', icon: FaImage },
    { name: 'Настройки', href: '/admin/settings', icon: FaCog },
    { name: 'Безопасность', href: '/admin/security', icon: FaShieldAlt },
    { name: 'База данных', href: '/admin/database', icon: FaDatabase },
  ];

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar (desktop only) */}
      <aside className="hidden lg:block fixed top-0 left-0 w-64 h-screen z-[50] bg-white shadow-lg border-r border-gray-200">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Админ панель</h1>
          <div className="flex items-center space-x-2">
            {/* Notification button */}
            <div className="relative">
              <button 
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700"
              >
                <FaBell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Bildirişlər</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Hamısını oxundu kimi qeyd et
                        </button>
                        <button
                          onClick={() => setNotificationDropdownOpen(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FaTimes className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Bildiriş yoxdur
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex-shrink-0 mt-1">
                                {notification.type === 'user' && <FaUser className="h-4 w-4 text-blue-500" />}
                                {notification.type === 'order' && <FaShoppingBag className="h-4 w-4 text-green-500" />}
                                {notification.type === 'stock' && <FaBox className="h-4 w-4 text-yellow-500" />}
                                {notification.type === 'system' && <FaBell className="h-4 w-4 text-gray-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Oxundu kimi qeyd et"
                                >
                                  <FaCheck className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => removeNotification(notification.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Sil"
                              >
                                <FaTimes className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
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
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
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
          <div className="fixed top-0 left-0 w-64 h-screen bg-white shadow-lg border-r border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Админ панель</h1>
              <div className="flex items-center space-x-2">
                {/* Notification button */}
                <div className="relative">
                  <button 
                    onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                    className="relative p-2 text-gray-500 hover:text-gray-700"
                  >
                    <FaBell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <FaSignOutAlt className="h-4 w-4" />
                </button>
                {/* Close button */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
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
            className="text-gray-500 hover:text-gray-700"
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