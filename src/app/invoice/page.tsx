'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
  sku?: string;
  categoryName?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

function InvoiceContent() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    const orderId = searchParams.get('orderId');
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, searchParams]);

  const fetchOrder = async (orderId: string) => {
    try {
      // Real sifariş məlumatlarını əldə et
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (response.ok) {
        const orderData = await response.json();
        // API array qaytarır, ilk elementi götür
        const order = Array.isArray(orderData) ? orderData[0] : orderData;
        
        if (order && order.items) {
          setOrder(order);
        } else {
          console.error('Sifariş məlumatları düzgün deyil:', order);
          setOrder(null);
        }
      } else {
        console.error('Sifariş tapılmadı');
        setOrder(null);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const completeOrder = async () => {
    if (!order) return;
    
    try {
      const response = await fetch('/api/orders/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          userId: user?.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Sifariş tamamlandıqdan sonra səbəti təmizlə
        try {
          await fetch('/api/cart/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user?.id })
          });
        } catch (clearError) {
          console.error('Cart clear error:', clearError);
        }
        
        alert('Sifariş uğurla tamamlandı! Admin təsdiqi gözləyir.');
        window.location.href = '/';
      } else {
        alert('Sifariş tamamlama zamanı xəta baş verdi.');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Sifariş tamamlama zamanı xəta baş verdi.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] flex items-center justify-center">
        <div className="text-white text-xl">Yüklənir...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Sifariş tapılmadı</div>
          <Link href="/cart" className="text-cyan-500 hover:text-cyan-400">
            Səbətə qayıt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Hesab-Faktura</h1>
          <p className="text-gray-300">Sifariş nömrəsi: {order.orderNumber}</p>
        </div>

        {/* Invoice Content */}
        <div className="bg-[#1e293b] rounded-xl p-8 shadow-2xl">
          {/* Company Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-cyan-500 mb-2">Sado-Parts</h2>
            <p className="text-gray-300">Запчасти для погрузчиков</p>
            <p className="text-gray-400 text-sm">Hesab-Faktura</p>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Sifariş Məlumatları</h3>
              <div className="space-y-2">
                <p className="text-gray-300"><span className="text-gray-400">Sifariş Nömrəsi:</span> {order.orderNumber}</p>
                <p className="text-gray-300"><span className="text-gray-400">Tarix:</span> {new Date(order.createdAt).toLocaleDateString('az-AZ')}</p>
                <p className="text-gray-300"><span className="text-gray-400">Status:</span> 
                  <span className={`ml-2 px-2 py-1 text-white text-xs rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-500' :
                    order.status === 'completed' ? 'bg-blue-500' :
                    order.status === 'approved' ? 'bg-green-500' :
                    order.status === 'rejected' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}>
                    {order.status === 'pending' ? 'Gözləmədə' :
                     order.status === 'completed' ? 'Təsdiq gözləyir' :
                     order.status === 'approved' ? 'Təsdiqləndi' :
                     order.status === 'rejected' ? 'Rədd edildi' :
                     order.status}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Müştəri Məlumatları</h3>
              <div className="space-y-2">
                <p className="text-gray-300"><span className="text-gray-400">Ad Soyad:</span> {user?.name}</p>
                <p className="text-gray-300"><span className="text-gray-400">Email:</span> {user?.email}</p>
                <p className="text-gray-300"><span className="text-gray-400">Endirim:</span> {user?.discountPercentage || 0}%</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Məhsullar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 text-gray-300 font-semibold">№</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold">Məhsul</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-center">Miqdar</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-right">Qiymət</th>
                    <th className="py-3 px-4 text-gray-300 font-semibold text-right">Ümumi</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-700">
                      <td className="py-3 px-4 text-gray-300">{index + 1}</td>
                      <td className="py-3 px-4 text-white">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.sku && <div className="text-sm text-gray-400">Artikul: {item.sku}</div>}
                          {item.categoryName && <div className="text-sm text-gray-400">Kateqoriya: {item.categoryName}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-gray-300 text-right">{(item.price || 0).toFixed(2)} ₼</td>
                      <td className="py-3 px-4 text-cyan-400 font-semibold text-right">{(item.totalPrice || 0).toFixed(2)} ₼</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="text-right mb-8">
            <div className="text-2xl font-bold text-cyan-500">
              Ümumi: {(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} ₼
            </div>
            <p className="text-gray-400 text-sm mt-1">Endirim daxil edilmiş qiymət</p>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Qeydlər</h3>
              <p className="text-gray-300">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-gray-400 text-sm">
            <p>Təşəkkür edirik!</p>
            <p>Sado-Parts - Запчасти для погрузчиков</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={printInvoice}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition"
          >
            🖨️ Çap et
          </button>
          
          {/* Sifariş statusuna görə düymələri göstər */}
          {order.status === 'pending' && (
            <button
              onClick={completeOrder}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              ✅ Sifarişi tamamla
            </button>
          )}
          
          {order.status === 'pending' && (
            <Link
              href="/catalog"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              Alış-verişə davam et
            </Link>
          )}
          
          {(order.status === 'completed' || order.status === 'approved' || order.status === 'rejected') && (
            <Link
              href="/"
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
            >
              Ana səhifəyə qayıt
            </Link>
          )}
          
          {(order.status === 'completed' || order.status === 'approved' || order.status === 'rejected') && (
            <Link
              href="/catalog"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              Yeni sifariş yarat
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] flex items-center justify-center">
        <div className="text-white text-xl">Yüklənir...</div>
      </div>
    }>
      <InvoiceContent />
    </Suspense>
  );
} 