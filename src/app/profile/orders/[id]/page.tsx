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

  // Real-time updates for customer view
  useEffect(() => {
    if (!order) return;
    
    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [order?.id]);

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
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
            }
            
            * { box-sizing: border-box; }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0ea5e9 100%);
              color: white;
              min-height: 100vh;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: rgba(30, 41, 59, 0.95);
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
              border: 1px solid rgba(14, 165, 233, 0.3);
            }
            
            .header { 
              text-align: center; 
              border-bottom: 3px solid #0ea5e9; 
              padding-bottom: 25px; 
              margin-bottom: 30px;
              background: rgba(15, 23, 42, 0.8);
              padding: 25px;
              border-radius: 10px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            }
            
            .header h1 {
              color: #0ea5e9;
              font-size: 2.8em;
              margin: 0;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
              font-weight: bold;
            }
            
            .header h2 {
              color: #e2e8f0;
              font-size: 1.6em;
              margin: 10px 0 0 0;
              font-weight: 300;
            }
            
            .invoice-details { 
              margin-bottom: 30px;
              background: rgba(15, 23, 42, 0.8);
              padding: 25px;
              border-radius: 10px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(14, 165, 233, 0.2);
            }
            
            .invoice-details h3 {
              color: #0ea5e9;
              margin: 0 0 20px 0;
              font-size: 1.4em;
              font-weight: 600;
            }
            
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            
            .detail-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid rgba(14, 165, 233, 0.2);
            }
            
            .detail-item:last-child {
              border-bottom: none;
            }
            
            .detail-label {
              color: #94a3b8;
              font-weight: 500;
            }
            
            .detail-value {
              color: #e2e8f0;
              font-weight: 600;
            }
            
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              color: white;
              font-weight: 600;
              font-size: 0.9em;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .status-pending { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .status-completed { background: linear-gradient(135deg, #3b82f6, #2563eb); }
            .status-approved { background: linear-gradient(135deg, #10b981, #059669); }
            .status-rejected { background: linear-gradient(135deg, #ef4444, #dc2626); }
            
            .items-section {
              margin: 30px 0;
              background: rgba(15, 23, 42, 0.8);
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(14, 165, 233, 0.2);
            }
            
            .items-section h3 {
              color: #0ea5e9;
              margin: 0;
              padding: 20px 25px;
              background: rgba(14, 165, 233, 0.1);
              border-bottom: 1px solid rgba(14, 165, 233, 0.3);
              font-size: 1.3em;
              font-weight: 600;
            }
            
            .items-table { 
              width: 100%; 
              border-collapse: collapse;
              margin: 0;
            }
            
            .items-table th { 
              background: rgba(14, 165, 233, 0.15);
              color: #0ea5e9;
              padding: 15px 20px;
              text-align: left;
              font-weight: 600;
              font-size: 0.95em;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid rgba(14, 165, 233, 0.3);
            }
            
            .items-table td { 
              padding: 15px 20px;
              border-bottom: 1px solid rgba(14, 165, 233, 0.1);
              color: #e2e8f0;
            }
            
            .items-table tr:hover {
              background: rgba(14, 165, 233, 0.05);
            }
            
            .product-name {
              font-weight: 600;
              color: #f1f5f9;
            }
            
            .product-sku {
              color: #94a3b8;
              font-size: 0.9em;
              margin-top: 5px;
            }
            
            .quantity-badge {
              background: rgba(14, 165, 233, 0.2);
              color: #0ea5e9;
              padding: 5px 12px;
              border-radius: 15px;
              font-weight: 600;
              font-size: 0.9em;
            }
            
            .price {
              color: #10b981;
              font-weight: 600;
            }
            
            .total-price {
              color: #0ea5e9;
              font-weight: 700;
              font-size: 1.1em;
            }
            
            .total-section { 
              text-align: right;
              background: rgba(15, 23, 42, 0.9);
              padding: 25px;
              border-radius: 10px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              border: 2px solid rgba(14, 165, 233, 0.3);
              margin-top: 30px;
            }
            
            .total-section h3 {
              color: #0ea5e9;
              margin: 0 0 15px 0;
              font-size: 1.4em;
              font-weight: 600;
            }
            
            .total-amount {
              font-size: 2.2em;
              font-weight: 700;
              color: #0ea5e9;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .notes-section {
              margin-top: 30px;
              background: rgba(15, 23, 42, 0.8);
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(14, 165, 233, 0.2);
            }
            
            .notes-section h4 {
              color: #0ea5e9;
              margin: 0 0 10px 0;
              font-size: 1.2em;
              font-weight: 600;
            }
            
            .notes-content {
              color: #e2e8f0;
              font-style: italic;
              line-height: 1.6;
            }
            
            .footer {
              margin-top: 40px; 
              text-align: center; 
              font-size: 14px; 
              color: #94a3b8;
              background: rgba(15, 23, 42, 0.8);
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(14, 165, 233, 0.2);
            }
            
            .footer p {
              margin: 5px 0;
            }
            
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: linear-gradient(135deg, #0ea5e9, #0284c7);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 25px;
              cursor: pointer;
              font-weight: 600;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              transition: all 0.3s ease;
            }
            
            .print-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            }
            
            @media print {
              .print-button { display: none; }
              body { background: white; color: black; }
              .invoice-container { 
                background: white; 
                color: black; 
                box-shadow: none;
                border: 1px solid #ddd;
              }
              .header h1 { color: #0ea5e9; }
              .header h2 { color: #333; }
              .invoice-details, .items-section, .total-section, .notes-section, .footer {
                background: #f8f9fa;
                color: #333;
                border: 1px solid #ddd;
              }
              .items-table th { background: #e9ecef; color: #495057; }
              .items-table td { color: #333; border-bottom: 1px solid #ddd; }
              .product-name { color: #333; }
              .product-sku { color: #6c757d; }
              .total-amount { color: #0ea5e9; }
            }
          </style>
        </head>
        <body>
          <button onclick="window.print()" class="print-button no-print">🖨️ Çap Et</button>
          
          <div class="invoice-container">
            <div class="header">
              <h1>Sado-Parts</h1>
              <h2>Hesab-Faktura</h2>
            </div>
            
            <div class="invoice-details">
              <h3>Sifariş Məlumatları</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Sifariş Nömrəsi:</span>
                  <span class="detail-value">${order.orderNumber}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Tarix:</span>
                  <span class="detail-value">${new Date(order.createdAt).toLocaleDateString('az-AZ')}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Saat:</span>
                  <span class="detail-value">${new Date(order.createdAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Məhsul Sayı:</span>
                  <span class="detail-value">${order.items.length} növ</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Ümumi Ədəd:</span>
                  <span class="detail-value">${order.items.reduce((sum, item) => sum + item.quantity, 0)} ədəd</span>
                </div>
              </div>
            </div>
            
            <div class="items-section">
              <h3>Məhsullar (${order.items.length})</h3>
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
                  ${order.items.map((item, index) => `
                    <tr>
                      <td>
                        <div class="product-name">${item.name}</div>
                        <div class="product-sku">SKU: ${item.sku}</div>
                        ${item.categoryName ? `<div class="product-sku">Kateqoriya: ${item.categoryName}</div>` : ''}
                      </td>
                      <td><span class="quantity-badge">${item.sku}</span></td>
                      <td><span class="quantity-badge">${item.quantity} ədəd</span></td>
                      <td class="price">${item.price.toFixed(2)} ₼</td>
                      <td class="total-price">${item.totalPrice.toFixed(2)} ₼</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="total-section">
              <h3>Ümumi Məbləğ</h3>
              <div class="total-amount">${(parseFloat(order.totalAmount?.toString() || '0')).toFixed(2)} ${order.currency}</div>
            </div>
            
            ${order.notes ? `
              <div class="notes-section">
                <h4>Qeydlər</h4>
                <div class="notes-content">${order.notes}</div>
              </div>
            ` : ''}
            
            <div class="footer">
              <p><strong>Sado-Parts</strong> - Запчасти для погрузчиков</p>
              <p>Premium-class online store</p>
              <p>Bu hesab-faktura ${new Date().toLocaleDateString('az-AZ')} tarixində yaradılmışdır</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
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