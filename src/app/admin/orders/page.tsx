'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.push('/login');
      return;
    }
    fetchAllOrders();
  }, [isAuthenticated, user]);

  const fetchAllOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders', {
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
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
      
      const data = await response.json();
      
      if (data.success) {
        fetchAllOrders(); // Refresh orders
        const statusMessages = {
          'confirmed': 'təsdiqləndi',
          'processing': 'işləməyə başladı',
          'shipped': 'göndərildi',
          'delivered': 'çatdırıldı',
          'cancelled': 'ləğv edildi'
        };
        alert(`Sifariş statusu uğurla ${statusMessages[status as keyof typeof statusMessages] || 'dəyişdirildi'}`);
      } else {
        alert('Status yeniləmə zamanı xəta baş verdi');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Status yeniləmə zamanı xəta baş verdi');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-1 py-0.5 bg-yellow-500 text-white text-xs rounded-full whitespace-nowrap">Gözləyir</span>;
      case 'confirmed':
        return <span className="px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full whitespace-nowrap">Təsdiqləndi</span>;
      case 'processing':
        return <span className="px-1 py-0.5 bg-purple-500 text-white text-xs rounded-full whitespace-nowrap">İşlənir</span>;
      case 'shipped':
        return <span className="px-1 py-0.5 bg-indigo-500 text-white text-xs rounded-full whitespace-nowrap">Göndərildi</span>;
      case 'delivered':
        return <span className="px-1 py-0.5 bg-green-500 text-white text-xs rounded-full whitespace-nowrap">Çatdırıldı</span>;
      case 'cancelled':
        return <span className="px-1 py-0.5 bg-red-500 text-white text-xs rounded-full whitespace-nowrap">Ləğv edildi</span>;
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
            Təsdiqlə
          </button>
          <button
            onClick={() => updateOrderStatus(order.id, 'cancelled')}
            className="px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition whitespace-nowrap"
          >
            Ləğv et
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
            İşləməyə başla
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
            Göndər
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
            Çatdırıldı
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
          <div className="text-white text-xl">Yüklənir...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sifarişlər</h1>
          <p className="text-gray-300">Bütün sifarişləri idarə edin</p>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-4 shadow-2xl">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-xl">Hələ sifariş yoxdur</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[140px]">Sifariş №</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[180px]">Müştəri</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[220px]">INN</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[100px]">Ümumi</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[100px]">Status</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[120px]">Tarix</th>
                    <th className="py-3 px-3 text-gray-300 font-semibold text-xs w-[120px]">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-700 hover:bg-[#0f172a] transition-colors">
                      <td className="py-3 px-3 text-white font-semibold text-xs">
                        <div className="font-mono text-xs">{order.orderNumber}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-300">
                        <div className="w-[180px]">
                          <div className="font-medium text-white text-xs truncate">
                            {order.customerName || 
                             (order.customerFirstName && order.customerLastName ? 
                               `${order.customerFirstName} ${order.customerLastName}` : 
                               'Müştəri')}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 truncate">{order.customerEmail}</div>
                          {order.customerPhone && (
                            <div className="text-xs text-gray-400 mt-1">📞 {order.customerPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-300">
                        <div className="w-[220px]">
                          <div className="text-xs font-medium text-white">
                            INN: {order.customerInn || 'Təyin edilməyib'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {order.items.length} məhsul
                          </div>
                          <div className="text-xs text-cyan-400 mt-1 font-medium">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} ədəd ümumi
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-cyan-400 font-semibold">
                        <div className="text-sm">{(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} ₼</div>
                        <div className="text-xs text-gray-400 mt-1">Endirimli qiymət</div>
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
                            👁️ Detallar
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
      </div>
    </div>
  );
} 