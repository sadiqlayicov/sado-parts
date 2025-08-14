'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
  sku: string;
  categoryName: string;
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

export default function AdminOrderDetailsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.push('/login');
      return;
    }
    fetchOrderDetails();
  }, [isAuthenticated, user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        setOrder(data.order);
      } else {
        alert('Sifariş məlumatları alına bilmədi');
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Sifariş məlumatları alına bilmədi');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status: string) => {
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
        // Optimize: Update local state instead of full refresh
        setOrder(prevOrder => {
          if (!prevOrder) return null;
          return {
            ...prevOrder,
            status: status
          };
        });
        const statusMessages = {
          'confirmed': 'təsdiqləndi',
          'processing': 'işləməyə başladı',
          'shipped': 'göndərildi',
          'delivered': 'çatdırıldı',
          'cancelled': 'ləğv edildi',
          'pending': 'gözləmədə'
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

  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    console.log('updateItemQuantity called with:', { itemId, newQuantity, orderId });
    
    try {
      const requestBody = {
        orderId,
        itemId,
        quantity: newQuantity
      };
      
      console.log('Sending request to API:', requestBody);
      
      const response = await fetch('/api/admin/orders/update-item-quantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        // Optimize: Update local state instead of full refresh
        setOrder(prevOrder => {
          if (!prevOrder) return null;
          return {
            ...prevOrder,
            items: prevOrder.items.map(item => 
              item.id === itemId 
                ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
                : item
            ),
            totalAmount: data.data.orderTotal
          };
        });
        console.log('Item quantity updated successfully:', { itemId, newQuantity, orderTotal: data.data.orderTotal });
      } else {
        console.error('API returned error:', data.error);
        alert('Məhsul sayı yeniləmə zamanı xəta baş verdi: ' + (data.error || 'Naməlum xəta'));
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
      alert('Məhsul sayı yeniləmə zamanı xəta baş verdi');
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm('Bu məhsulu sifarişdən silmək istədiyinizə əminsiniz?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/orders/remove-item', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          itemId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Optimize: Update local state instead of full refresh
        setOrder(prevOrder => {
          if (!prevOrder) return null;
          return {
            ...prevOrder,
            items: prevOrder.items.filter(item => item.id !== itemId),
            totalAmount: data.data.orderTotal
          };
        });
        alert('Məhsul uğurla silindi');
      } else {
        alert('Məhsul silmə zamanı xəta baş verdi');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Məhsul silmə zamanı xəta baş verdi');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-full">Gözləmədə</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">Təsdiq gözləyir</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">Təsdiqləndi</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">Rədd edildi</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500 text-white text-sm rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-white text-xl">Yüklənir...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-white text-xl">Sifariş tapılmadı</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Sifariş Detalları</h1>
              <p className="text-gray-300">Sifariş #{order.orderNumber}</p>
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
            >
              ← Geri
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Sifariş Məlumatları</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Sifariş Nömrəsi</p>
                  <p className="text-white font-mono text-lg">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tarix</p>
                  <p className="text-white">{new Date(order.createdAt).toLocaleDateString('az-AZ')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Saat</p>
                  <p className="text-white">
                    {new Date(order.createdAt).toLocaleTimeString('az-AZ', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ümumi Məbləğ</p>
                  <p className="text-cyan-400 font-bold text-2xl">
                    {(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} {order.currency}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Məhsul Sayı</p>
                  <p className="text-white text-lg">{order.items.length} növ</p>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm">Qeydlər</p>
                  <p className="text-white bg-[#0f172a] p-3 rounded mt-1">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Müştəri Məlumatları</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Ad Soyad</p>
                  <p className="text-white font-medium">{order.customerName || 'Müştəri'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{order.customerEmail}</p>
                </div>
                {order.customerPhone && (
                  <div>
                    <p className="text-gray-400 text-sm">Telefon</p>
                    <p className="text-white">📞 {order.customerPhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 text-sm">Müştəri ID</p>
                  <p className="text-white font-mono text-sm">{order.userId}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Məhsullar ({order.items.length})</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id} className="bg-[#0f172a] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm">#{index + 1}</span>
                          <div>
                            <h3 className="text-white font-medium">{item.name}</h3>
                            <p className="text-gray-400 text-sm">SKU: {item.sku}</p>
                            {item.categoryName && (
                              <p className="text-gray-400 text-sm">Kateqoriya: {item.categoryName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium">Sayı:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                console.log('Decrease button clicked for item:', item.id, 'current quantity:', item.quantity);
                                updateItemQuantity(item.id, Math.max(1, item.quantity - 1));
                              }}
                              className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center transition"
                            >
                              -
                            </button>
                            <span className="text-white font-bold min-w-[40px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => {
                                console.log('Increase button clicked for item:', item.id, 'current quantity:', item.quantity);
                                updateItemQuantity(item.id, item.quantity + 1);
                              }}
                              className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center transition"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm">{item.price.toFixed(2)} ₼</p>
                        <p className="text-cyan-500 font-bold">{item.totalPrice.toFixed(2)} ₼</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Əməliyyatlar</h2>
              <div className="space-y-3">
                <button
                  onClick={() => updateOrderStatus('confirmed')}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded transition font-medium"
                >
                  ✅ Təsdiqlə
                </button>
                <button
                  onClick={() => updateOrderStatus('cancelled')}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded transition font-medium"
                >
                  ❌ Rədd et
                </button>
                <button
                  onClick={() => updateOrderStatus('delivered')}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
                >
                  🔄 Tamamla
                </button>
                <button
                  onClick={() => updateOrderStatus('pending')}
                  className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition font-medium"
                >
                  ⏳ Gözləmədə
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Xülasə</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Məhsul növləri:</span>
                  <span className="text-white font-medium">{order.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ümumi ədəd:</span>
                  <span className="text-white font-medium">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ümumi məbləğ:</span>
                  <span className="text-cyan-400 font-bold">
                    {(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} ₼
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 