'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { FaPlus, FaSync, FaCog, FaCheck, FaTimes, FaGlobe } from 'react-icons/fa';

export default function MarketplacesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [marketplaces, setMarketplaces] = useState([
    {
      id: 1,
      name: 'Avito',
      status: 'active',
      products: 156,
      orders: 23,
      revenue: 125000,
      lastSync: '2 мин назад',
      icon: '🟢'
    },
    {
      id: 2,
      name: 'Ozon',
      status: 'active',
      products: 89,
      orders: 15,
      revenue: 89000,
      lastSync: '5 мин назад',
      icon: '🟠'
    },
    {
      id: 3,
      name: 'Яндекс.Маркет',
      status: 'inactive',
      products: 0,
      orders: 0,
      revenue: 0,
      lastSync: 'Никогда',
      icon: '🟡'
    },
    {
      id: 4,
      name: 'Wildberries',
      status: 'error',
      products: 45,
      orders: 8,
      revenue: 67000,
      lastSync: '1 час назад',
      icon: '🟣'
    }
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user?.isAdmin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активен';
      case 'inactive':
        return 'Неактивен';
      case 'error':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FaCheck className="text-green-600" />;
      case 'inactive':
        return <FaTimes className="text-gray-400" />;
      case 'error':
        return <FaTimes className="text-red-600" />;
      default:
        return <FaTimes className="text-gray-400" />;
    }
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Маркетплейсы</h1>
          <p className="text-gray-600">Управление интеграциями с торговыми площадками</p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mb-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center">
            <FaPlus className="mr-2" />
            + Добавить площадку
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaGlobe className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Активные площадки</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего товаров</p>
                <p className="text-2xl font-bold text-gray-900">290</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего заказов</p>
                <p className="text-2xl font-bold text-gray-900">46</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Общая выручка</p>
                <p className="text-2xl font-bold text-gray-900">281.0K ₽</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Marketplaces */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Подключенные площадки</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marketplaces.map((marketplace) => (
              <div key={marketplace.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                      {marketplace.icon}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{marketplace.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(marketplace.status)}`}>
                        {getStatusText(marketplace.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                      <FaSync className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                      <FaCog className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Товары</p>
                    <p className="text-lg font-semibold text-gray-900">{marketplace.products}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Заказы</p>
                    <p className="text-lg font-semibold text-gray-900">{marketplace.orders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Выручка</p>
                    <p className="text-lg font-semibold text-gray-900">{(marketplace.revenue / 1000).toFixed(1)}K ₽</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Последняя синхронизация: {marketplace.lastSync}
                  </p>
                  <div className="flex items-center">
                    {getStatusIcon(marketplace.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 