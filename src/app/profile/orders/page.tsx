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
  sku: string;
  categoryName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return { text: 'Gözləyir', color: 'text-yellow-600 bg-yellow-100' };
    case 'confirmed':
      return { text: 'Təsdiqləndi', color: 'text-blue-600 bg-blue-100' };
    case 'processing':
      return { text: 'İşlənir', color: 'text-purple-600 bg-purple-100' };
    case 'shipped':
      return { text: 'Göndərildi', color: 'text-indigo-600 bg-indigo-100' };
    case 'delivered':
      return { text: 'Çatdırıldı', color: 'text-green-600 bg-green-100' };
    case 'cancelled':
      return { text: 'Ləğv edildi', color: 'text-red-600 bg-red-100' };
    default:
      return { text: 'Naməlum', color: 'text-gray-600 bg-gray-100' };
  }
};

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
    if (!user?.id) {
      console.log('No user ID available');
      setError('İstifadəçi məlumatları tapılmadı');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching orders for user:', user.id);
      const response = await fetch(`/api/orders?userId=${user.id}`);
      
      console.log('Orders response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Orders data:', data);
        setOrders(data.orders || []);
      } else {
        const errorData = await response.json();
        console.error('Orders API error:', errorData);
        setError(`Sifarişlər yüklənərkən xəta baş verdi: ${errorData.error || 'Naməlum xəta'}`);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      setError('Sifarişlər yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Sifarişlər yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sifarişlərim</h1>
          <p className="mt-2 text-gray-600">
            Bütün sifarişlərinizin statusunu və detallarını görə bilərsiniz
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 font-medium">Xəta baş verdi:</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    fetchOrders();
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Yenidən cəhd edin
                </button>
              </div>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hələ sifarişiniz yoxdur</h3>
            <p className="text-gray-600 mb-6">
              İlk sifarişinizi vermək üçün kataloqa keçin və məhsullar seçin
            </p>
            <button
              onClick={() => router.push('/catalog')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Kataloqa keç
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusText(order.status);
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => router.push(`/invoice?orderId=${order.id}`)}
                  title="Sifarişin detallarını görmək üçün klik edin"
                >
                  {/* Order Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/invoice?orderId=${order.id}`);
                          }}
                        >
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                            Sifariş #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span 
                          className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/invoice?orderId=${order.id}`);
                          }}
                          title="Sifarişin detallarını görmək üçün klik edin"
                        >
                          {statusInfo.text}
                        </span>
                        <div 
                          className="text-right cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/invoice?orderId=${order.id}`);
                          }}
                          title="Sifarişin detallarını görmək üçün klik edin"
                        >
                          <p className="text-lg font-bold text-gray-900 hover:text-blue-600">
                            {order.totalAmount.toLocaleString('ru-RU')} ₽
                          </p>
                          <p className="text-sm text-gray-500">
                            {totalItems} məhsul
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/invoice?orderId=${order.id}`);
                    }}
                    title="Sifarişin detallarını görmək üçün klik edin"
                  >
                    <h4 className="font-medium text-gray-900 mb-3 hover:text-blue-600">Məhsullar:</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>SKU: {item.sku}</span>
                              <span>Kateqoriya: {item.categoryName}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {item.quantity} x {item.price.toLocaleString('ru-RU')} ₽
                            </p>
                            <p className="text-sm text-gray-500">
                              Cəmi: {item.totalPrice.toLocaleString('ru-RU')} ₽
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer */}
                  {order.notes && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Qeyd:</span> {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Back to Profile */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/profile')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Profilə qayıt
          </button>
        </div>
      </div>
    </div>
  );
}
