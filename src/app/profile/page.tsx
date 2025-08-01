'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    fetchUserData();
  }, [isAuthenticated]);

  const fetchUserData = async () => {
    try {
      // Mock data - real API-də bu məlumatlar database-dən gələcək
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          status: 'completed',
          totalAmount: 1500,
          createdAt: '2024-01-15T10:30:00Z',
          items: [
            { id: '1', productName: 'Toyota Forklift Parts', quantity: 2, price: 750 }
          ]
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          status: 'processing',
          totalAmount: 2300,
          createdAt: '2024-01-20T14:20:00Z',
          items: [
            { id: '2', productName: 'Komatsu Hydraulic Pump', quantity: 1, price: 2300 }
          ]
        },
        {
          id: '3',
          orderNumber: 'ORD-003',
          status: 'pending',
          totalAmount: 800,
          createdAt: '2024-01-25T09:15:00Z',
          items: [
            { id: '3', productName: 'Nissan Brake Pads', quantity: 4, price: 200 }
          ]
        }
      ];

      const mockPayments: Payment[] = [
        {
          id: '1',
          orderId: '1',
          amount: 1500,
          status: 'confirmed',
          paymentMethod: 'Kart',
          createdAt: '2024-01-15T10:35:00Z'
        },
        {
          id: '2',
          orderId: '2',
          amount: 2300,
          status: 'pending',
          paymentMethod: 'Nağd',
          createdAt: '2024-01-20T14:25:00Z'
        },
        {
          id: '3',
          orderId: '3',
          amount: 800,
          status: 'cancelled',
          paymentMethod: 'Kart',
          createdAt: '2024-01-25T09:20:00Z'
        }
      ];

      setOrders(mockOrders);
      setPayments(mockPayments);
    } catch (error) {
              console.error('Ошибка получения данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'text-green-500 bg-green-100';
      case 'processing':
      case 'pending':
        return 'text-yellow-500 bg-yellow-100';
      case 'cancelled':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlanmış';
      case 'processing':
        return 'İcra olunur';
      case 'pending':
        return 'Gözləmədə';
      case 'cancelled':
        return 'İmtina edilmiş';
      case 'confirmed':
        return 'Təsdiq olunmuş';
      default:
        return status;
    }
  };

     const printOrder = (order: Order) => {
     const printWindow = window.open('', '_blank');
     if (printWindow) {
       printWindow.document.write(`
         <!DOCTYPE html>
         <html>
         <head>
           <title>Sifariş - ${order.orderNumber}</title>
           <style>
             @media print {
               body { 
                 background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0ea5e9 100%);
                 color: white;
                 font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                 margin: 0;
                 padding: 20px;
                 min-height: 100vh;
               }
             }
             body { 
               background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0ea5e9 100%);
               color: white;
               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
               margin: 0;
               padding: 20px;
               min-height: 100vh;
             }
             .header { 
               text-align: center; 
               border-bottom: 2px solid #0ea5e9; 
               padding-bottom: 20px; 
               margin-bottom: 30px;
               background: rgba(30, 41, 59, 0.8);
               padding: 20px;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
             }
             .header h1 {
               color: #0ea5e9;
               font-size: 2.5em;
               margin: 0;
               text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
             }
             .header h2 {
               color: #e2e8f0;
               font-size: 1.5em;
               margin: 10px 0 0 0;
             }
             .order-info { 
               margin-bottom: 30px;
               background: rgba(30, 41, 59, 0.8);
               padding: 20px;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
             }
             .order-info h3 {
               color: #0ea5e9;
               margin: 0 0 15px 0;
               font-size: 1.3em;
             }
             .order-info p {
               margin: 8px 0;
               color: #e2e8f0;
             }
             .items { 
               margin-bottom: 30px;
               background: rgba(30, 41, 59, 0.8);
               padding: 20px;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
             }
             .items h3 {
               color: #0ea5e9;
               margin: 0 0 20px 0;
               font-size: 1.3em;
             }
             .total { 
               font-weight: bold; 
               font-size: 1.5em; 
               text-align: right;
               background: rgba(30, 41, 59, 0.8);
               padding: 20px;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
             }
             .total h3 {
               color: #0ea5e9;
               margin: 0;
             }
             .status { 
               color: #0ea5e9; 
               font-weight: bold;
               background: rgba(14, 165, 233, 0.2);
               padding: 5px 10px;
               border-radius: 5px;
               display: inline-block;
             }
             table { 
               width: 100%; 
               border-collapse: collapse;
               background: rgba(15, 23, 42, 0.6);
               border-radius: 8px;
               overflow: hidden;
             }
             th, td { 
               padding: 12px; 
               text-align: left; 
               border-bottom: 1px solid #334155;
             }
             th { 
               background: linear-gradient(135deg, #0ea5e9, #0284c7);
               color: white;
               font-weight: bold;
             }
             td {
               color: #e2e8f0;
             }
             tr:hover {
               background: rgba(14, 165, 233, 0.1);
             }
             .footer {
               margin-top: 40px; 
               text-align: center; 
               font-size: 14px; 
               color: #94a3b8;
               background: rgba(30, 41, 59, 0.8);
               padding: 20px;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
             }
             .footer p {
               margin: 5px 0;
             }
           </style>
         </head>
         <body>
           <div class="header">
             <h1>Sado-Parts</h1>
             <h2>Sifariş Detalları</h2>
           </div>
           
           <div class="order-info">
             <h3>Sifariş Nömrəsi: ${order.orderNumber}</h3>
             <p><strong>Tarix:</strong> ${new Date(order.createdAt).toLocaleDateString('az-AZ')}</p>
             <p><strong>Status:</strong> <span class="status">${getStatusText(order.status)}</span></p>
           </div>
           
           <div class="items">
             <h3>Məhsullar:</h3>
             <table>
               <thead>
                 <tr>
                   <th>Məhsul</th>
                   <th>Miqdar</th>
                   <th>Qiymət</th>
                   <th>Ümumi</th>
                 </tr>
               </thead>
               <tbody>
                 ${order.items.map(item => `
                   <tr>
                     <td>${item.productName}</td>
                     <td>${item.quantity}</td>
                     <td>${item.price.toFixed(2)} ₼</td>
                     <td>${(item.price * item.quantity).toFixed(2)} ₼</td>
                   </tr>
                 `).join('')}
               </tbody>
             </table>
           </div>
           
           <div class="total">
             <h3>Ümumi Məbləğ: ${order.totalAmount.toFixed(2)} ₼</h3>
           </div>
           
           <div class="footer">
             <p>Təşəkkür edirik!</p>
             <p>Sado-Parts - Запчасти для погрузчиков</p>
           </div>
         </body>
         </html>
       `);
       printWindow.document.close();
       printWindow.print();
     }
   };

     const printPayment = (payment: Payment) => {
     const printWindow = window.open('', '_blank');
     if (printWindow) {
       printWindow.document.write(`
         <!DOCTYPE html>
         <html>
         <head>
           <title>Ödəniş - #${payment.id}</title>
           <style>
             @media print {
               body { 
                 background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0ea5e9 100%);
                 color: white;
                 font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                 margin: 0;
                 padding: 20px;
                 min-height: 100vh;
               }
             }
             body { 
               background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0ea5e9 100%);
               color: white;
               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
               margin: 0;
               padding: 20px;
               min-height: 100vh;
             }
             .header { 
               text-align: center; 
               border-bottom: 2px solid #0ea5e9; 
               padding-bottom: 20px; 
               margin-bottom: 30px;
               background: rgba(30, 41, 59, 0.8);
               padding: 20px;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
             }
             .header h1 {
               color: #0ea5e9;
               font-size: 2.5em;
               margin: 0;
               text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
             }
             .header h2 {
               color: #e2e8f0;
               font-size: 1.5em;
               margin: 10px 0 0 0;
             }
             .payment-info { 
               margin-bottom: 30px;
               background: rgba(30, 41, 59, 0.8);
               padding: 20px;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
             }
             .info-row { 
               margin: 15px 0;
               padding: 10px;
               border-bottom: 1px solid #334155;
               display: flex;
               justify-content: space-between;
               align-items: center;
             }
             .info-row:last-child {
               border-bottom: none;
             }
             .info-row strong {
               color: #0ea5e9;
               font-size: 1.1em;
             }
             .info-row span {
               color: #e2e8f0;
               font-size: 1.1em;
             }
             .status { 
               color: #0ea5e9; 
               font-weight: bold;
               background: rgba(14, 165, 233, 0.2);
               padding: 5px 10px;
               border-radius: 5px;
               display: inline-block;
             }
             .amount { 
               font-size: 1.8em; 
               font-weight: bold; 
               color: #0ea5e9;
               text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
             }
             .footer {
               margin-top: 40px; 
               text-align: center; 
               font-size: 14px; 
               color: #94a3b8;
               background: rgba(30, 41, 59, 0.8);
               padding: 20px;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
             }
             .footer p {
               margin: 5px 0;
             }
           </style>
         </head>
         <body>
           <div class="header">
             <h1>Sado-Parts</h1>
             <h2>Ödəniş Qəbzi</h2>
           </div>
           
           <div class="payment-info">
             <div class="info-row">
               <strong>Ödəniş Nömrəsi:</strong> <span>#${payment.id}</span>
             </div>
             <div class="info-row">
               <strong>Sifariş Nömrəsi:</strong> <span>${payment.orderId}</span>
             </div>
             <div class="info-row">
               <strong>Tarix:</strong> <span>${new Date(payment.createdAt).toLocaleDateString('az-AZ')}</span>
             </div>
             <div class="info-row">
               <strong>Ödəniş Üsulu:</strong> <span>${payment.paymentMethod}</span>
             </div>
             <div class="info-row">
               <strong>Status:</strong> <span class="status">${getStatusText(payment.status)}</span>
             </div>
             <div class="info-row">
               <strong>Məbləğ:</strong> <span class="amount">${payment.amount.toFixed(2)} ₼</span>
             </div>
           </div>
           
           <div class="footer">
             <p>Təşəkkür edirik!</p>
             <p>Sado-Parts - Запчасти для погрузчиков</p>
           </div>
         </body>
         </html>
       `);
       printWindow.document.close();
       printWindow.print();
     }
   };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">İstifadəçi Profili</h1>
          <p className="text-gray-300">Sifarişləriniz və ödənişləriniz</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[#1e293b] rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              activeTab === 'profile'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Profil Məlumatları
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Sifarişlər ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              activeTab === 'payments'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Ödənişlər ({payments.length})
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                  <p className="text-gray-300">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Ümumi Sifarişlər</h3>
                  <p className="text-3xl font-bold text-cyan-500">{orders.length}</p>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Ümumi Ödənişlər</h3>
                  <p className="text-3xl font-bold text-cyan-500">{payments.length}</p>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Tamamlanmış Sifarişlər</h3>
                  <p className="text-3xl font-bold text-green-500">
                    {orders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Gözləmədə Sifarişlər</h3>
                  <p className="text-3xl font-bold text-yellow-500">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Sifarişləriniz</h2>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300">Hələ heç bir sifarişiniz yoxdur</p>
                  <Link href="/catalog" className="text-cyan-500 hover:text-cyan-400 mt-2 inline-block">
                    Kataloqa baxın
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-[#0f172a] rounded-lg p-6">
                                             <div className="flex justify-between items-start mb-4">
                         <div>
                           <h3 className="text-lg font-semibold text-white">{order.orderNumber}</h3>
                           <p className="text-gray-300 text-sm">
                             {new Date(order.createdAt).toLocaleDateString('az-AZ')}
                           </p>
                         </div>
                         <div className="text-right">
                           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                             {getStatusText(order.status)}
                           </span>
                           <p className="text-2xl font-bold text-cyan-500 mt-1">
                             {order.totalAmount.toFixed(2)} ₼
                           </p>
                           <button
                             onClick={() => printOrder(order)}
                             className="mt-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs rounded transition"
                           >
                             🖨️ Çap et
                           </button>
                         </div>
                       </div>
                      
                                             <div className="space-y-2">
                         {order.items.map((item) => (
                           <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-700">
                             <div>
                               <p className="text-white">{item.productName}</p>
                               <div className="text-gray-400 text-sm">
                                 <span>Miqdar: {item.quantity}</span>
                                 <span className="mx-2">•</span>
                                 <span>Qiymət: {item.price.toFixed(2)} ₼</span>
                               </div>
                             </div>
                             <p className="text-cyan-500 font-semibold">
                               {(item.price * item.quantity).toFixed(2)} ₼
                             </p>
                           </div>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Ödənişləriniz</h2>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300">Hələ heç bir ödənişiniz yoxdur</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="bg-[#0f172a] rounded-lg p-6">
                                             <div className="flex justify-between items-start">
                         <div>
                           <h3 className="text-lg font-semibold text-white">Ödəniş #{payment.id}</h3>
                           <p className="text-gray-300 text-sm">
                             Sifariş: {payment.orderId}
                           </p>
                           <p className="text-gray-300 text-sm">
                             {new Date(payment.createdAt).toLocaleDateString('az-AZ')}
                           </p>
                           <p className="text-gray-300 text-sm">
                             Ödəniş üsulu: {payment.paymentMethod}
                           </p>
                         </div>
                         <div className="text-right">
                           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                             {getStatusText(payment.status)}
                           </span>
                           <p className="text-2xl font-bold text-cyan-500 mt-1">
                             {payment.amount.toFixed(2)} ₼
                           </p>
                           <button
                             onClick={() => printPayment(payment)}
                             className="mt-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs rounded transition"
                           >
                             🖨️ Çap et
                           </button>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 