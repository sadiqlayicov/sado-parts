'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { FaEye, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';

interface Order {
  id: string;
  client: string;
  email: string;
  inn: string;
  items: number;
  totalAmount: number;
  status: string;
  date: string;
  time: string;
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user?.isAdmin) {
      router.push('/');
      return;
    }
    
    // Fetch orders from API
    fetchOrders();
  }, [isAuthenticated, user, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      
      if (data.success) {
        // Transform API data to match frontend format
        const transformedOrders = data.orders.map((order: any) => ({
          id: order.id,
          client: order.customerName || 'Müştəri',
          email: order.customerEmail || 'email@example.com',
          inn: order.customerInn ? `ИНН: ${order.customerInn}` : 'ИНН: Не указан',
          items: order.items?.length || 0,
          totalAmount: parseFloat(order.totalAmount) || 0,
          status: order.status || 'pending',
          date: new Date(order.createdAt).toLocaleDateString('ru-RU'),
          time: new Date(order.createdAt).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));
        setOrders(transformedOrders);
      } else {
        console.error('Failed to fetch orders:', data.error);
        alert('Sifarişləri yükləmə zamanı xəta baş verdi');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Sifarişləri yükləmə zamanı xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      alert('Пожалуйста, выберите заказы для удаления');
      return;
    }

    if (confirm(`Вы уверены, что хотите удалить ${selectedOrders.length} заказов?`)) {
      try {
        const response = await fetch('/api/admin/orders/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderIds: selectedOrders }),
        });

        if (response.ok) {
          setOrders(prev => prev.filter(order => !selectedOrders.includes(order.id)));
          setSelectedOrders([]);
          alert('Заказы успешно удалены');
        } else {
          alert('Ошибка при удалении заказов');
        }
      } catch (error) {
        console.error('Error deleting orders:', error);
        alert('Произошла ошибка при удалении заказов');
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ заказы? Это действие нельзя отменить.')) {
      try {
        const response = await fetch('/api/admin/orders/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderIds: orders.map(order => order.id) }),
        });

        if (response.ok) {
          setOrders([]);
          setSelectedOrders([]);
          alert('Все заказы успешно удалены');
        } else {
          alert('Ошибка при удалении заказов');
        }
      } catch (error) {
        console.error('Error deleting all orders:', error);
        alert('Произошла ошибка при удалении заказов');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В ожидании';
      case 'confirmed':
        return 'Подтвержден';
      case 'cancelled':
        return 'Отменен';
      default:
        return 'Неизвестно';
    }
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Заказы</h1>
          <p className="text-gray-600">Управление всеми заказами</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mb-6 space-x-4">
          <button
            onClick={handleBulkDelete}
            disabled={selectedOrders.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Seçilənləri sil
          </button>
          <button
            onClick={handleDeleteAll}
            className="bg-red-800 hover:bg-red-900 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Bütün sifarişləri sil
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Заказ №
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ИНН
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Общая сумма
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Операции
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      Загрузка заказов...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      Заказы не найдены
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.client}</div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.inn}</div>
                      <div className="text-sm text-gray-500">{order.items} товаров</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.totalAmount.toFixed(2)} ₽</div>
                      <div className="text-sm text-gray-500">Цена со скидкой</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{order.date}</div>
                      <div className="text-gray-500">{order.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="text-blue-600 hover:text-blue-900 transition"
                          title="Детали"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 transition"
                          title="Подтвердить"
                        >
                          <FaCheck className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 transition"
                          title="Отменить"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 