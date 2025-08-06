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
}

export default function UserOrderDetailsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchOrderDetails();
  }, [isAuthenticated, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}?userId=${user?.id}`);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setOrder(data[0]);
      } else {
        alert('Sifariş məlumatları alına bilmədi');
        router.push('/profile');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Sifariş məlumatları alına bilmədi');
      router.push('/profile');
    } finally {
      setLoading(false);
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

  const printInvoice = () => {
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Hesab-Faktura - ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
            .status { display: inline-block; padding: 5px 10px; border-radius: 15px; color: white; }
            .status.pending { background-color: #f59e0b; }
            .status.completed { background-color: #3b82f6; }
            .status.approved { background-color: #10b981; }
            .status.rejected { background-color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sado-Parts</h1>
            <h2>Hesab-Faktura</h2>
          </div>
          
          <div class="invoice-details">
            <p><strong>Sifariş Nömrəsi:</strong> ${order.orderNumber}</p>
            <p><strong>Tarix:</strong> ${new Date(order.createdAt).toLocaleDateString('az-AZ')}</p>
            <p><strong>Status:</strong> <span class="status ${order.status}">${getStatusText(order.status)}</span></p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Məhsul</th>
                <th>SKU</th>
                <th>Sayı</th>
                <th>Qiymət</th>
                <th>Ümumi</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.sku}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(2)} ₼</td>
                  <td>${item.totalPrice.toFixed(2)} ₼</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p><strong>Ümumi Məbləğ: ${(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} ${order.currency}</strong></p>
          </div>
          
          ${order.notes ? `<p><strong>Qeydlər:</strong> ${order.notes}</p>` : ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Gözləmədə';
      case 'completed': return 'Təsdiq gözləyir';
      case 'approved': return 'Təsdiqləndi';
      case 'rejected': return 'Rədd edildi';
      default: return status;
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
            <div className="flex gap-3">
              <button
                onClick={printInvoice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-2"
              >
                🖨️ Hesab-Faktura
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                ← Geri
              </button>
            </div>
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
                        <p className="text-white font-medium">{item.quantity} ədəd</p>
                        <p className="text-gray-400 text-sm">{item.price.toFixed(2)} ₼</p>
                        <p className="text-cyan-500 font-bold">{item.totalPrice.toFixed(2)} ₼</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* Actions */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Əməliyyatlar</h2>
              <div className="space-y-3">
                <button
                  onClick={printInvoice}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium flex items-center justify-center gap-2"
                >
                  🖨️ Hesab-Faktura Çap Et
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded transition font-medium"
                >
                  ← Profilə Qayıt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 