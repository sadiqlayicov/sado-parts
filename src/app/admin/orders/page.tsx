'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { formatId, resetIdCounter } from '@/lib/utils';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  totalAmount: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customerName?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerInn?: string;
}

export default function AdminOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.push('/login');
      return;
    }
    resetIdCounter(); // Reset ID counter when component mounts
    fetchAllOrders();
  }, [isAuthenticated, user]);

  const fetchAllOrders = async () => {
    try {
      console.log('Fetching admin orders...');
      const response = await fetch('/api/admin/orders', {
        cache: 'no-store'
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.success) {
        setOrders(data.orders);
        console.log('Orders set successfully:', data.orders.length);
      } else {
        console.error('API returned success: false:', data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      console.log('Updating order status:', { orderId, status });
      
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        await fetchAllOrders(); // Refresh orders
        const statusMessages = {
          'confirmed': 'подтвержден',
          'processing': 'в обработке',
          'shipped': 'отправлен',
          'delivered': 'доставлен',
          'cancelled': 'отменен'
        };
        alert(`Статус заказа успешно изменен на: ${statusMessages[status as keyof typeof statusMessages] || 'изменен'}`);
      } else {
        console.error('API returned success: false:', data);
        alert(`Ошибка при обновлении статуса: ${data.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(`Произошла ошибка при обновлении статуса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((s) => ({ ...s, [id]: checked }));
  };

  const selectAllOnPage = (checked: boolean) => {
    const ids = orders.map((o) => o.id);
    setSelected((s) => {
      const next = { ...s };
      ids.forEach((id) => (next[id] = checked));
      return next;
    });
  };

  const getSelectedIds = () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const bulkDelete = async (all: boolean) => {
    const ids = getSelectedIds();
    if (!all && ids.length === 0) {
      alert('Silinəcək sifariş seçilməyib');
      return;
    }
    if (!confirm(all ? 'Bütün sifarişləri silmək istəyirsiniz?' : `${ids.length} sifarişi silmək istəyirsiniz?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(all ? { deleteAll: true } : { orderIds: ids })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAllOrders();
        setSelected({});
        alert(`Silindi: ${data.deleted}`);
      } else {
        alert(data.error || 'Silinmə zamanı xəta');
      }
    } catch (e) {
      alert('Xəta baş verdi');
    } finally {
      setBulkLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-1 py-0.5 bg-yellow-500 text-white text-xs rounded-full whitespace-nowrap">В ожидании</span>;
      case 'confirmed':
        return <span className="px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full whitespace-nowrap">Подтвержден</span>;
      case 'processing':
        return <span className="px-1 py-0.5 bg-purple-500 text-white text-xs rounded-full whitespace-nowrap">В обработке</span>;
      case 'shipped':
        return <span className="px-1 py-0.5 bg-indigo-500 text-white text-xs rounded-full whitespace-nowrap">Отправлен</span>;
      case 'delivered':
        return <span className="px-1 py-0.5 bg-green-500 text-white text-xs rounded-full whitespace-nowrap">Доставлен</span>;
      case 'cancelled':
        return <span className="px-1 py-0.5 bg-red-500 text-white text-xs rounded-full whitespace-nowrap">Отменен</span>;
      default:
        return <span className="px-1 py-0.5 bg-gray-500 text-white text-xs rounded-full whitespace-nowrap">{status}</span>;
    }
  };

  const getStatusActions = (order: Order) => {
    if (order.status === 'pending') {
      return (
        <>
          <button
            onClick={() => updateOrderStatus(order.id, 'confirmed')}
            className="px-1 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition whitespace-nowrap"
          >
            Подтвердить
          </button>
          <button
            onClick={() => updateOrderStatus(order.id, 'cancelled')}
            className="px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition whitespace-nowrap"
          >
            Отменить
          </button>
        </>
      );
    } else if (order.status === 'confirmed') {
      return (
        <>
          <button
            onClick={() => updateOrderStatus(order.id, 'processing')}
            className="px-1 py-0.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition whitespace-nowrap"
          >
            Начать обработку
          </button>
        </>
      );
    } else if (order.status === 'processing') {
      return (
        <>
          <button
            onClick={() => updateOrderStatus(order.id, 'shipped')}
            className="px-1 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition whitespace-nowrap"
          >
            Отправить
          </button>
        </>
      );
    } else if (order.status === 'shipped') {
      return (
        <>
          <button
            onClick={() => updateOrderStatus(order.id, 'delivered')}
            className="px-1 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition whitespace-nowrap"
          >
            Доставить
          </button>
        </>
      );
    }
    return null;
  };

  const handleOrderClick = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-white text-xl">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Заказы</h1>
            <p className="text-gray-300">Управление всеми заказами</p>
          </div>
          <div className="flex gap-2">
            <button disabled={bulkLoading} onClick={() => bulkDelete(false)} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded">Seçilənləri sil</button>
            <button disabled={bulkLoading} onClick={() => bulkDelete(true)} className="px-3 py-2 bg-red-800 hover:bg-red-900 text-white text-xs rounded">Bütün sifarişləri sil</button>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-4 shadow-2xl">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-xl">Заказов пока нет</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-3"><input type="checkbox" onChange={(e) => selectAllOnPage(e.target.checked)} /></th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[140px]">Заказ №</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[180px]">Клиент</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[220px]">ИНН</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[100px]">Общая сумма</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[100px]">Статус</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[120px]">Дата</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[120px]">Операции</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-700 hover:bg-[#0f172a] transition-colors">
                      <td className="py-3 px-3"><input type="checkbox" checked={!!selected[order.id]} onChange={(e) => toggleSelect(order.id, e.target.checked)} /></td>
                      <td className="py-3 px-3 text-white font-semibold text-xs">
                        <div className="font-mono text-xs">{order.orderNumber}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-300">
                        <div className="w-[180px]">
                          <div className="font-medium text-white text-xs truncate">
                            {order.customerName || 'Клиент'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 truncate">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-300">
                        <div className="w-[220px]">
                          <div className="text-xs font-medium text-white">
                            ИНН: {order.customerInn || 'Не указан'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {order.items?.length || 0} товаров
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-cyan-400 font-semibold">
                        <div className="text-sm">{(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} ₽</div>
                        <div className="text-xs text-gray-400 mt-1">Цена со скидкой</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-[100px]">
                          {getStatusBadge(order.status)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-300 text-xs">
                        <div className="w-[120px]">
                          <div className="text-xs">{new Date(order.createdAt).toLocaleDateString('az-AZ')}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(order.createdAt).toLocaleTimeString('az-AZ', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 w-[120px]">
                          <button
                            onClick={() => handleOrderClick(order.id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition flex items-center justify-center gap-1"
                          >
                            👁️ Детали
                          </button>
                          {getStatusActions(order)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* bulk buttons moved to header */}
      </div>
    </div>
  );
} 