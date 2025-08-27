'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Profile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  inn: string;
  address: string;
  country: string;
  city: string;
  isApproved: boolean;
  discountPercentage: number;
  registrationDate: string;
  lastLogin: string;
}

interface Statistics {
  totalOrders: number;
  totalSpent: number;
  completedOrders: number;
  pendingOrders: number;
  discountPercentage: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  sku: string;
  images: string[];
  categoryName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  createdAt: string;
}



interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

function ProfilePageContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    // Check for tab parameter in URL
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'orders', 'addresses'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    if (user?.id) {
      fetchUserData();
    }
  }, [isAuthenticated, user?.id, searchParams]);

  const fetchUserData = async () => {
    try {
      if (!user?.id) return;

      const response = await fetch(`/api/profile?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        setStatistics(data.statistics);
        setOrders(data.orders);
        setAddresses(data.addresses);
      } else {
        console.error('Профильные данные не загружены:', data.error);
      }
    } catch (error) {
      console.error('Ошибка при получении профильных данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'text-green-500 bg-green-100';
      case 'processing':
      case 'pending':
        return 'text-yellow-500 bg-yellow-100';
      case 'cancelled':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает подтверждения';
      case 'confirmed':
        return 'Подтвержден';
      case 'processing':
        return 'В обработке';
      case 'shipped':
        return 'Отправлен';
      case 'delivered':
        return 'Доставлен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const handleOrderClick = async (orderId: string) => {
    // Navigate to invoice page to view order details
    router.push(`/invoice?orderId=${orderId}`);
  };





  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-6xl mx-auto px-6 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Профиль пользователя</h1>
            <p className="text-gray-600 text-sm md:text-base">Ваши заказы и платежи</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex flex-1 sm:flex-none space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'profile'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Личные данные
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'orders'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Заказы ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'addresses'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Адреса ({addresses.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка данных...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'П'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{profile?.name || user?.name}</h2>
                    <p className="text-gray-600">{profile?.email || user?.email}</p>
                    {profile?.phone && (
                      <p className="text-gray-600">📞 {profile.phone}</p>
                    )}
                  </div>
                </div>

                {/* Личные данные */}
                {profile && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Личные данные</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Имя</p>
                        <p className="text-gray-900 break-words leading-relaxed">{profile.firstName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Фамилия</p>
                        <p className="text-gray-900 break-words leading-relaxed">{profile.lastName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">ИНН</p>
                        <p className="text-gray-900 break-words leading-relaxed">{profile.inn || 'Не указан'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Страна</p>
                        <p className="text-gray-900 break-words leading-relaxed">{profile.country || 'Не указана'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Город</p>
                        <p className="text-gray-900 break-words leading-relaxed">{profile.city || 'Не указан'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Адрес</p>
                        <p className="text-gray-900 break-words leading-relaxed whitespace-normal">{profile.address || 'Не указан'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Статистика */}
                {statistics && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Статистика</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Всего заказов</h3>
                        <p className="text-2xl md:text-3xl font-bold text-cyan-500">{statistics?.totalOrders || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Общие расходы</h3>
                        <p className="text-2xl md:text-3xl font-bold text-cyan-500">{statistics?.totalSpent?.toFixed(2) || '0.00'} ₽</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Выполненные заказы</h3>
                        <p className="text-2xl md:text-3xl font-bold text-green-500">{statistics?.completedOrders || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Ожидающие заказы</h3>
                        <p className="text-2xl md:text-3xl font-bold text-yellow-500">{statistics?.pendingOrders || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Ваши заказы</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">У вас пока нет заказов</p>
                    <Link href="/catalog" className="text-blue-600 hover:text-blue-400 mt-2 inline-block">
                      Посмотреть каталог
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="bg-gray-50 rounded-lg p-6 cursor-pointer hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-blue-200"
                        onClick={() => handleOrderClick(order.id)}
                        onDoubleClick={() => handleOrderClick(order.id)}
                        title="Sifarişin detallarını görmək üçün klik edin"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">
                              Заказ #{order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Дата: {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                            <p className="text-sm text-gray-600">
                              Товаров: {order.itemsCount}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg md:text-xl font-bold text-gray-900">
                              {order.totalAmount.toLocaleString()} ₽
                            </p>
                            <span className={`inline-block px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ваши адреса</h2>
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">У вас пока нет сохраненных адресов</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {address.street}
                            </h3>
                            <p className="text-gray-600">
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="text-gray-600">{address.country}</p>
                          </div>
                          {address.isDefault && (
                            <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                              По умолчанию
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
} 