'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, 
  FaBox, 
  FaShoppingCart, 
  FaCreditCard, 
  FaChartLine, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaCog,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaUpload,
  FaTimesCircle
} from 'react-icons/fa';

export default function AdminDashboard() {
  const { isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();
  

  
  const [stats, setStats] = useState({
    totalUsers: 1247,
    totalProducts: 284,
    totalOrders: 892,
    totalRevenue: 15420000,
    pendingOrders: 23,
    lowStockProducts: 8,
    newReviews: 15,
    activePromotions: 5
  });

  const [recentOrders, setRecentOrders] = useState([
    { id: 1, customer: 'Иван Петров', amount: 12500, status: 'new', time: '2 мин назад' },
    { id: 2, customer: 'Мария Сидорова', amount: 8500, status: 'processing', time: '15 мин назад' },
    { id: 3, customer: 'Алексей Козлов', amount: 18500, status: 'shipped', time: '1 час назад' },
    { id: 4, customer: 'Елена Воробьева', amount: 3200, status: 'completed', time: '2 часа назад' },
    { id: 5, customer: 'Дмитрий Соколов', amount: 45000, status: 'new', time: '3 часа назад' }
  ]);

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'order', message: 'Новый заказ #1234 от Ивана Петрова', time: '2 мин назад' },
    { id: 2, type: 'user', message: 'Зарегистрирован новый пользователь', time: '5 мин назад' },
    { id: 3, type: 'stock', message: 'Низкий остаток товара "Поршень двигателя"', time: '10 мин назад' },
    { id: 4, type: 'review', message: 'Новый отзыв на товар "Масляный фильтр"', time: '15 мин назад' },
    { id: 5, type: 'payment', message: 'Оплачен заказ #1230', time: '20 мин назад' }
  ]);

  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/analytics');
        const data = await res.json();
        setStats({
          totalUsers: data.userCount || 0,
          totalProducts: data.productCount || 0,
          totalOrders: data.orderCount || 0,
          totalRevenue: data.totalSales || 0,
          pendingOrders: 0, // Əgər backend-də varsa əlavə et
          lowStockProducts: 0, // Əgər backend-də varsa əlavə et
          newReviews: 0, // Əgər backend-də varsa əlavə et
          activePromotions: 0 // Əgər backend-də varsa əlavə et
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }
    fetchStats();
  }, []);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            У вас нет прав для доступа к административной панели
          </p>
          <a href="/login" className="text-blue-500 hover:text-blue-600">Войти в систему</a>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'shipped': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'processing': return 'В обработке';
      case 'shipped': return 'Отправлен';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  const handleCreateOrder = () => {
    setShowCreateOrderModal(true);
  };

  const handleAddProduct = () => {
    setShowAddProductModal(true);
  };

  const handleUserManagement = () => {
    setShowUserManagementModal(true);
  };

  const handleNavigateToAnalytics = () => {
    router.push('/admin/analytics');
  };

  const handleNavigateToSettings = () => {
    router.push('/admin/settings');
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/admin/orders?order=${orderId}`);
  };

  const handleViewAllOrders = () => {
    router.push('/admin/orders');
  };

  const handleViewAllActivities = () => {
    // Navigate to activity log or show more activities
    console.log('View all activities');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Панель управления</h1>
          <p className="text-gray-600 dark:text-gray-400">Добро пожаловать в административную панель</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleCreateOrder}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center"
          >
            <FaPlus className="mr-2" />
            Создать заказ
          </button>
          <button 
            onClick={handleAddProduct}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center"
          >
            <FaPlus className="mr-2" />
            Добавить товар
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FaUsers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Пользователи</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FaBox className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Товары</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FaShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Заказы</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FaCreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Выручка</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats.totalRevenue / 1000000).toFixed(1)}M ₽
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {stats.pendingOrders} заказов ожидают обработки
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {stats.lowStockProducts} товаров с низким остатком
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <FaStar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {stats.newReviews} новых отзывов
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Последние заказы</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      #{order.id} - {order.customer}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.time}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.amount.toLocaleString()} ₽
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={handleViewAllOrders}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Посмотреть все заказы →
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Последние действия</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={handleViewAllActivities}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Посмотреть все действия →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Быстрые действия</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleCreateOrder}
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <FaShoppingCart className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Создать заказ</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Новый заказ</p>
              </div>
            </button>

            <button
              onClick={handleAddProduct}
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <FaBox className="h-6 w-6 text-green-600 mr-3" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Добавить товар</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Новый товар</p>
              </div>
            </button>

            <button
              onClick={handleUserManagement}
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <FaUsers className="h-6 w-6 text-purple-600 mr-3" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Управление пользователями</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Пользователи</p>
              </div>
            </button>

            <button
              onClick={handleNavigateToAnalytics}
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <FaChartLine className="h-6 w-6 text-yellow-600 mr-3" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Аналитика</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Отчеты</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Создать новый заказ</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Клиент
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option>Выберите клиента</option>
                  <option>Иван Петров</option>
                  <option>Мария Сидорова</option>
                  <option>Алексей Козлов</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Товары
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option>Выберите товары</option>
                  <option>Поршень двигателя</option>
                  <option>Масляный фильтр</option>
                  <option>Тормозные колодки</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Способ доставки
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option>Курьерская доставка</option>
                  <option>Самовывоз</option>
                  <option>Почта России</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateOrderModal(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Создать заказ
              </button>
              <button
                onClick={() => setShowCreateOrderModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Добавить новый товар</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название товара
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Введите название"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Категория
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option>Выберите категорию</option>
                  <option>Двигатель</option>
                  <option>Тормозная система</option>
                  <option>Электрика</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Цена
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Количество на складе
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddProductModal(false)}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Добавить товар
              </button>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Управление пользователями</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Иван Петров</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ivan@example.com</p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                    <FaCheckCircle className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <FaTimesCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Мария Сидорова</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">maria@example.com</p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                    <FaCheckCircle className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <FaTimesCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => router.push('/admin/users')}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Перейти к управлению
              </button>
              <button
                onClick={() => setShowUserManagementModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 