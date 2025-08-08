'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  user: {
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
  };
  items: OrderItem[];
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

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (user?.id) {
      fetchUserData();
    }
  }, [isAuthenticated, user?.id]);

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
    setLoadingOrder(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedOrder(data.order);
        setShowOrderModal(true);
      } else {
        alert('Сведения о заказе не загружены');
      }
    } catch (error) {
      console.error('Ошибка при получении деталей заказа:', error);
      alert('Сведения о заказе не загружены');
    } finally {
      setLoadingOrder(false);
    }
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Заказ ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-info { margin-bottom: 20px; }
          .total { font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          .status { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sado-Parts</h1>
          <h2>Детали заказа</h2>
        </div>
        
        <div class="order-info">
          <h3>Номер заказа: ${order.orderNumber}</h3>
          <p><strong>Дата:</strong> ${new Date(order.createdAt).toLocaleDateString('ru-RU')}</p>
          <p><strong>Статус:</strong> <span class="status">${getStatusText(order.status)}</span></p>
          <p><strong>Количество товаров:</strong> ${order.itemsCount}</p>
        </div>
        
        <div class="total">
          <h3>Общая сумма: ${(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} ${order.currency}</h3>
        </div>
        
        <div class="footer">
          <p>Спасибо за заказ!</p>
          <p>Sado-Parts - Запчасти для погрузчиков</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Профиль пользователя</h1>
          <p className="text-gray-300">Ваши заказы и платежи</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[#1e293b] rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              activeTab === 'profile'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Личные данные
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Заказы ({orders.length})
          </button>
          <Link
            href="/profile/orders"
            className={`flex-1 py-3 px-4 rounded-md font-medium transition text-center ${
              'bg-blue-500 text-white'
            }`}
          >
            Все заказы
          </Link>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              activeTab === 'addresses'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Адреса ({addresses.length})
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'П'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{profile?.name || user?.name}</h2>
                  <p className="text-gray-300">{profile?.email || user?.email}</p>
                  {profile?.phone && (
                    <p className="text-gray-300">📞 {profile.phone}</p>
                  )}
                </div>
              </div>

              {/* Личные данные */}
              {profile && (
                <div className="bg-[#0f172a] rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Личные данные</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Имя</p>
                      <p className="text-white">{profile.firstName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Фамилия</p>
                      <p className="text-white">{profile.lastName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">ИНН</p>
                      <p className="text-white">{profile.inn || 'Не указан'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Страна</p>
                      <p className="text-white">{profile.country || 'Не указана'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Город</p>
                      <p className="text-white">{profile.city || 'Не указан'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Адрес</p>
                      <p className="text-white">{profile.address || 'Не указан'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Статистика */}
              {statistics && (
                <div className="bg-[#0f172a] rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Статистика</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0f172a] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Всего заказов</h3>
                      <p className="text-3xl font-bold text-cyan-500">{statistics?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-[#0f172a] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Общие расходы</h3>
                      <p className="text-3xl font-bold text-cyan-500">{statistics?.totalSpent?.toFixed(2) || '0.00'} ₽</p>
                    </div>
                    <div className="bg-[#0f172a] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Выполненные заказы</h3>
                      <p className="text-3xl font-bold text-green-500">{statistics?.completedOrders || 0}</p>
                    </div>
                    <div className="bg-[#0f172a] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Ожидающие заказы</h3>
                      <p className="text-3xl font-bold text-yellow-500">{statistics?.pendingOrders || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Ваши заказы</h2>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300">У вас пока нет заказов</p>
                  <Link href="/catalog" className="text-cyan-500 hover:text-cyan-400 mt-2 inline-block">
                    Посмотреть каталог
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-[#0f172a] rounded-lg p-6 cursor-pointer hover:bg-[#1e293b] transition-all duration-200 border border-transparent hover:border-cyan-500/30"
                      onClick={() => handleOrderClick(order.id)}
                      onDoubleClick={() => handleOrderClick(order.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Заказ #{order.orderNumber}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            Дата: {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Товаров: {order.itemsCount}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-white mb-2">
                            {order.totalAmount.toLocaleString()} ₽
                          </p>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
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
              <h2 className="text-2xl font-bold text-white mb-4">Ваши адреса</h2>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300">У вас пока нет сохраненных адресов</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="bg-[#0f172a] rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {address.street}
                          </h3>
                          <p className="text-gray-400">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p className="text-gray-400">{address.country}</p>
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
      </div>
    </div>
  );
} 