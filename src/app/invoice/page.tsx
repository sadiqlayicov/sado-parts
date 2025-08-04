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
      // For now, we'll create a mock order since we don't have the orders table
      // In a real implementation, this would fetch from the actual orders table
      const mockOrder: Order = {
        id: orderId,
        orderNumber: `ORD-${Date.now()}`,
        status: 'pending',
        totalAmount: 240,
        currency: 'AZN',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            name: 'Product cmdsinv7',
            quantity: 2,
            price: 80,
            totalPrice: 160
          },
          {
            id: 'item-2',
            productId: 'product-2',
            name: 'Product cmdsinv8',
            quantity: 1,
            price: 80,
            totalPrice: 80
          }
        ]
      };

      setOrder(mockOrder);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => {
    window.print();
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
                  <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                    Gözləmədə
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
                  {order.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-700">
                      <td className="py-3 px-4 text-gray-300">{index + 1}</td>
                      <td className="py-3 px-4 text-white">{item.name}</td>
                      <td className="py-3 px-4 text-gray-300 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-gray-300 text-right">{item.price.toFixed(2)} ₼</td>
                      <td className="py-3 px-4 text-cyan-400 font-semibold text-right">{item.totalPrice.toFixed(2)} ₼</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="text-right mb-8">
            <div className="text-2xl font-bold text-cyan-500">
              Ümumi: {order.totalAmount.toFixed(2)} ₼
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
          <Link
            href="/profile"
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            Profilə qayıt
          </Link>
          <Link
            href="/catalog"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Alış-verişə davam et
          </Link>
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