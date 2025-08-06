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
  customerEmail?: string;
  customerPhone?: string;
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
      const response = await fetch('/api/admin/orders');
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
        alert(`Sifariş statusu uğurla ${status === 'approved' ? 'təsdiqləndi' : status === 'rejected' ? 'rədd edildi' : 'dəyişdirildi'}`);
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
        return <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">Gözləmədə</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">Təsdiq gözləyir</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Təsdiqləndi</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">Rədd edildi</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">{status}</span>;
    }
  };

  const getStatusActions = (order: Order) => {
    if (order.status === 'completed') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => updateOrderStatus(order.id, 'approved')}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition"
          >
            Təsdiqlə
          </button>
          <button
            onClick={() => updateOrderStatus(order.id, 'rejected')}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
          >
            Rədd et
          </button>
        </div>
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sifarişlər</h1>
          <p className="text-gray-300">Bütün sifarişləri idarə edin</p>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-xl">Hələ sifariş yoxdur</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 text-gray-300 font-semibold text-sm">Sifariş №</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-sm">Müştəri</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-sm">Məhsullar</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-sm">Ümumi</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-sm">Status</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-sm">Tarix</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-sm">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-700 hover:bg-[#0f172a] transition-colors">
                      <td className="py-3 px-4 text-white font-semibold text-sm">
                        <div className="font-mono">{order.orderNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        <div className="min-w-[200px]">
                          <div className="font-medium text-white">{order.customerName || 'Müştəri'}</div>
                          <div className="text-xs text-gray-400">{order.customerEmail}</div>
                          {order.customerPhone && (
                            <div className="text-xs text-gray-400">📞 {order.customerPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        <div className="min-w-[250px]">
                          <div className="text-sm font-medium text-white">
                            {order.items.length} məhsul
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {order.items.slice(0, 2).map(item => item.name).join(', ')}
                            {order.items.length > 2 && ` və ${order.items.length - 2} ədəd daha`}
                          </div>
                          <div className="text-xs text-cyan-400 mt-1">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} ədəd ümumi
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-semibold">
                        <div className="text-lg">{(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} ₼</div>
                        <div className="text-xs text-gray-400">Endirimli qiymət</div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        <div>{new Date(order.createdAt).toLocaleDateString('az-AZ')}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString('az-AZ', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleOrderClick(order.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition flex items-center justify-center gap-1"
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