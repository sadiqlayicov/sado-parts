'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaUsers, 
  FaShoppingCart, 
  FaBox, 
  FaCreditCard,
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaCalendar,
  FaDownload,
  FaFilter,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

export default function AnalyticsDashboard() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [metrics, setMetrics] = useState({
    totalRevenue: 15420000,
    totalOrders: 892,
    totalCustomers: 1247,
    averageOrderValue: 17287,
    conversionRate: 3.2,
    customerRetention: 68.5,
    topProducts: [
      { name: "Поршень двигателя Toyota", sales: 45, revenue: 562500 },
      { name: "Масляный фильтр Komatsu", sales: 67, revenue: 56950 },
      { name: "Воздушный фильтр Nissan", sales: 89, revenue: 96120 },
      { name: "Топливный насос Mitsubishi", sales: 23, revenue: 425500 },
      { name: "Турбина Garrett", sales: 34, revenue: 1530000 }
    ],
    revenueByCategory: [
      { category: "Двигатель", revenue: 8500000, percentage: 55.1 },
      { category: "Трансмиссия", revenue: 3200000, percentage: 20.8 },
      { category: "Тормоза", revenue: 2100000, percentage: 13.6 },
      { category: "Электрика", revenue: 1200000, percentage: 7.8 },
      { category: "Гидравлика", revenue: 420000, percentage: 2.7 }
    ],
    salesData: [
      { date: '2024-07-01', revenue: 450000, orders: 25 },
      { date: '2024-07-02', revenue: 520000, orders: 28 },
      { date: '2024-07-03', revenue: 380000, orders: 22 },
      { date: '2024-07-04', revenue: 610000, orders: 35 },
      { date: '2024-07-05', revenue: 480000, orders: 26 },
      { date: '2024-07-06', revenue: 550000, orders: 30 },
      { date: '2024-07-07', revenue: 420000, orders: 24 },
      { date: '2024-07-08', revenue: 590000, orders: 32 },
      { date: '2024-07-09', revenue: 510000, orders: 28 },
      { date: '2024-07-10', revenue: 680000, orders: 38 },
      { date: '2024-07-11', revenue: 470000, orders: 25 },
      { date: '2024-07-12', revenue: 540000, orders: 29 },
      { date: '2024-07-13', revenue: 390000, orders: 21 },
      { date: '2024-07-14', revenue: 620000, orders: 34 },
      { date: '2024-07-15', revenue: 530000, orders: 29 },
      { date: '2024-07-16', revenue: 460000, orders: 25 },
      { date: '2024-07-17', revenue: 580000, orders: 31 },
      { date: '2024-07-18', revenue: 500000, orders: 27 },
      { date: '2024-07-19', revenue: 650000, orders: 36 },
      { date: '2024-07-20', revenue: 480000, orders: 26 }
    ]
  });

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const getRevenueChange = () => {
    const recent = metrics.salesData.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
    const previous = metrics.salesData.slice(-14, -7).reduce((sum, day) => sum + day.revenue, 0);
    return previous > 0 ? ((recent - previous) / previous * 100).toFixed(1) : '0';
  };

  const getOrdersChange = () => {
    const recent = metrics.salesData.slice(-7).reduce((sum, day) => sum + day.orders, 0);
    const previous = metrics.salesData.slice(-14, -7).reduce((sum, day) => sum + day.orders, 0);
    return previous > 0 ? ((recent - previous) / previous * 100).toFixed(1) : '0';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Аналитика</h1>
          <p className="text-gray-600 dark:text-gray-400">Бизнес-аналитика и отчеты</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="week">За неделю</option>
            <option value="month">За месяц</option>
            <option value="quarter">За квартал</option>
            <option value="year">За год</option>
          </select>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center">
            <FaDownload className="mr-2" />
            Экспорт отчета
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FaCreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Общая выручка</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(metrics.totalRevenue / 1000000).toFixed(1)}M ₽
              </p>
                             <div className="flex items-center mt-1">
                 {parseFloat(getRevenueChange()) >= 0 ? (
                   <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
                 ) : (
                   <FaArrowDown className="h-4 w-4 text-red-500 mr-1" />
                 )}
                 <span className={`text-sm ${parseFloat(getRevenueChange()) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {getRevenueChange()}%
                 </span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FaShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Заказы</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalOrders}</p>
                             <div className="flex items-center mt-1">
                 {parseFloat(getOrdersChange()) >= 0 ? (
                   <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
                 ) : (
                   <FaArrowDown className="h-4 w-4 text-red-500 mr-1" />
                 )}
                 <span className={`text-sm ${parseFloat(getOrdersChange()) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {getOrdersChange()}%
                 </span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FaUsers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Клиенты</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalCustomers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Удержание: {metrics.customerRetention}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FaChartLine className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Средний чек</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.averageOrderValue.toLocaleString()} ₽
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Конверсия: {metrics.conversionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Выручка по дням</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {metrics.salesData.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {day.revenue.toLocaleString()} ₽
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {day.orders} заказов
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Выручка по категориям</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {metrics.revenueByCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {category.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.revenue.toLocaleString()} ₽
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Топ товары</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Товар
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Продажи
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Выручка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Рейтинг
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.sales} шт
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.revenue.toLocaleString()} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaStar className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">4.8</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Конверсия</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Посетители</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">27,890</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Корзины</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">892</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Конверсия</span>
              <span className="text-sm font-medium text-green-600">{metrics.conversionRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Клиенты</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Новые</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">392</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Возвращающиеся</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">855</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Удержание</span>
              <span className="text-sm font-medium text-green-600">{metrics.customerRetention}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Доставка</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Среднее время</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">2.3 дня</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Успешные</span>
              <span className="text-sm font-medium text-green-600">98.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Возвраты</span>
              <span className="text-sm font-medium text-red-600">1.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 