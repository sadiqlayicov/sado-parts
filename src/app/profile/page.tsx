'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

interface Profile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  inn: string;
  address: string;
  country: string;
  city: string;
  isApproved: boolean;
  discountPercentage: number;
  registrationDate: string;
  lastLogin: string;
}

interface Statistics {
  totalOrders: number;
  totalSpent: number;
  completedOrders: number;
  pendingOrders: number;
  discountPercentage: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  sku: string;
  images: string[];
  categoryName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  createdAt: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    phone: string;
    inn: string;
    address: string;
    country: string;
    city: string;
  };
  items: OrderItem[];
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (user?.id) {
      fetchUserData();
    }
  }, [isAuthenticated, user?.id]);

  const fetchUserData = async () => {
    try {
      if (!user?.id) return;

      const response = await fetch(`/api/profile?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        setStatistics(data.statistics);
        setOrders(data.orders);
        setAddresses(data.addresses);
      } else {
        console.error('Profil məlumatları alına bilmədi:', data.error);
      }
    } catch (error) {
      console.error('Profil məlumatlarını əldə etmə zamanı xəta baş verdi:', error);
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
      case 'delivered':
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

  const handleOrderClick = async (orderId: string) => {
    setLoadingOrder(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedOrder(data.order);
        setShowOrderModal(true);
      } else {
        alert('Sifariş məlumatları alına bilmədi');
      }
    } catch (error) {
      console.error('Sifariş detallarını əldə etmə xətası:', error);
      alert('Sifariş məlumatları alına bilmədi');
    } finally {
      setLoadingOrder(false);
    }
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
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
             <p><strong>Məhsul sayı:</strong> ${order.itemsCount}</p>
           </div>
           
           <div class="total">
             <h3>Ümumi Məbləğ: ${order.totalAmount.toFixed(2)} ${order.currency}</h3>
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
             Şəxsi Məlumatlar
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
             onClick={() => setActiveTab('addresses')}
             className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
               activeTab === 'addresses'
                 ? 'bg-cyan-500 text-white'
                 : 'text-gray-300 hover:text-white'
             }`}
           >
             Ünvanlar ({addresses.length})
           </button>
         </div>

        {/* Content */}
        <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                     {activeTab === 'profile' && (
             <div className="space-y-6">
               <div className="flex items-center space-x-4">
                 <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center">
                   <span className="text-2xl font-bold text-white">
                     {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                   </span>
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-white">{profile?.name || user?.name}</h2>
                   <p className="text-gray-300">{profile?.email || user?.email}</p>
                   {profile?.phone && (
                     <p className="text-gray-300">📞 {profile.phone}</p>
                   )}
                 </div>
               </div>

               {/* Şəxsi Məlumatlar */}
               {profile && (
                 <div className="bg-[#0f172a] rounded-lg p-6">
                   <h3 className="text-xl font-semibold text-white mb-4">Şəxsi Məlumatlar</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <p className="text-gray-400 text-sm">Ad</p>
                       <p className="text-white">{profile.firstName}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 text-sm">Soyad</p>
                       <p className="text-white">{profile.lastName}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 text-sm">INN</p>
                       <p className="text-white">{profile.inn || 'Təyin edilməyib'}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 text-sm">Ölkə</p>
                       <p className="text-white">{profile.country || 'Təyin edilməyib'}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 text-sm">Şəhər</p>
                       <p className="text-white">{profile.city || 'Təyin edilməyib'}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 text-sm">Ünvan</p>
                       <p className="text-white">{profile.address || 'Təyin edilməyib'}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 text-sm">Endirim faizi</p>
                       <p className="text-white">{profile.discountPercentage}%</p>
                     </div>
                     <div>
                       <p className="text-gray-400 text-sm">Qeydiyyat tarixi</p>
                       <p className="text-white">{new Date(profile.registrationDate).toLocaleDateString('az-AZ')}</p>
                     </div>
                   </div>
                 </div>
               )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Ümumi Sifarişlər</h3>
                  <p className="text-3xl font-bold text-cyan-500">{statistics?.totalOrders || 0}</p>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Ümumi Xərclər</h3>
                  <p className="text-3xl font-bold text-cyan-500">{statistics?.totalSpent?.toFixed(2) || '0.00'} ₼</p>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Tamamlanmış Sifarişlər</h3>
                  <p className="text-3xl font-bold text-green-500">{statistics?.completedOrders || 0}</p>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Gözləmədə Sifarişlər</h3>
                  <p className="text-3xl font-bold text-yellow-500">{statistics?.pendingOrders || 0}</p>
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
                     <div 
                       key={order.id} 
                       className="bg-[#0f172a] rounded-lg p-6 cursor-pointer hover:bg-[#1e293b] transition-all duration-200 border border-transparent hover:border-cyan-500/30"
                       onClick={() => handleOrderClick(order.id)}
                       onDoubleClick={() => handleOrderClick(order.id)}
                     >
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <h3 className="text-lg font-semibold text-white">{order.orderNumber}</h3>
                           <p className="text-gray-300 text-sm">
                             {new Date(order.createdAt).toLocaleDateString('az-AZ')}
                           </p>
                           <p className="text-gray-400 text-xs">
                             Məhsul sayı: {order.itemsCount}
                           </p>
                         </div>
                         <div className="text-right">
                           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                             {getStatusText(order.status)}
                           </span>
                           <p className="text-2xl font-bold text-cyan-500 mt-1">
                             {order.totalAmount.toFixed(2)} ₼
                           </p>
                           <div className="flex gap-2 mt-2">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 printOrder(order);
                               }}
                               className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs rounded transition"
                             >
                               🖨️ Çap et
                             </button>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleOrderClick(order.id);
                               }}
                               className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition"
                             >
                               👁️ Detallar
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}

          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Ünvanlarınız</h2>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300">Hələ heç bir ünvan əlavə etməmisiniz</p>
                  <Link href="/catalog" className="text-cyan-500 hover:text-cyan-400 mt-2 inline-block">
                    Sifariş vermək üçün kataloqa baxın
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="bg-[#0f172a] rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {address.street}
                            </h3>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                Əsas
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300">
                            {address.city}, {address.state && `${address.state}, `}{address.country}
                          </p>
                          {address.postalCode && (
                            <p className="text-gray-400 text-sm">
                              Poçt kodu: {address.postalCode}
                            </p>
                          )}
                          <p className="text-gray-400 text-sm">
                            Əlavə edildi: {new Date(address.createdAt).toLocaleDateString('az-AZ')}
                          </p>
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

       {/* Sifariş Detalları Modal */}
       {showOrderModal && selectedOrder && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-[#1e293b] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-white">
                   Sifariş Detalları - {selectedOrder.orderNumber}
                 </h2>
                 <button
                   onClick={closeOrderModal}
                   className="text-gray-400 hover:text-white text-2xl"
                 >
                   ✕
                 </button>
               </div>

               {loadingOrder ? (
                 <div className="text-center py-8">
                   <div className="text-white">Yüklənir...</div>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {/* Sifariş Məlumatları */}
                   <div className="bg-[#0f172a] rounded-lg p-4">
                     <h3 className="text-lg font-semibold text-white mb-3">Sifariş Məlumatları</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <p className="text-gray-400 text-sm">Sifariş Nömrəsi</p>
                         <p className="text-white font-medium">{selectedOrder.orderNumber}</p>
                       </div>
                       <div>
                         <p className="text-gray-400 text-sm">Status</p>
                         <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                           {getStatusText(selectedOrder.status)}
                         </span>
                       </div>
                       <div>
                         <p className="text-gray-400 text-sm">Tarix</p>
                         <p className="text-white">{new Date(selectedOrder.createdAt).toLocaleDateString('az-AZ')}</p>
                       </div>
                       <div>
                         <p className="text-gray-400 text-sm">Ümumi Məbləğ</p>
                         <p className="text-white font-bold text-lg">{selectedOrder.totalAmount.toFixed(2)} {selectedOrder.currency}</p>
                       </div>
                       {selectedOrder.notes && (
                         <div className="md:col-span-2">
                           <p className="text-gray-400 text-sm">Qeydlər</p>
                           <p className="text-white">{selectedOrder.notes}</p>
                         </div>
                       )}
                     </div>
                   </div>

                   {/* Müştəri Məlumatları */}
                   <div className="bg-[#0f172a] rounded-lg p-4">
                     <h3 className="text-lg font-semibold text-white mb-3">Müştəri Məlumatları</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <p className="text-gray-400 text-sm">Ad Soyad</p>
                         <p className="text-white">{selectedOrder.user.name}</p>
                       </div>
                       <div>
                         <p className="text-gray-400 text-sm">Email</p>
                         <p className="text-white">{selectedOrder.user.email}</p>
                       </div>
                       <div>
                         <p className="text-gray-400 text-sm">Telefon</p>
                         <p className="text-white">{selectedOrder.user.phone || 'Təyin edilməyib'}</p>
                       </div>
                       <div>
                         <p className="text-gray-400 text-sm">INN</p>
                         <p className="text-white">{selectedOrder.user.inn || 'Təyin edilməyib'}</p>
                       </div>
                       <div>
                         <p className="text-gray-400 text-sm">Ölkə</p>
                         <p className="text-white">{selectedOrder.user.country || 'Təyin edilməyib'}</p>
                       </div>
                       <div>
                         <p className="text-gray-400 text-sm">Şəhər</p>
                         <p className="text-white">{selectedOrder.user.city || 'Təyin edilməyib'}</p>
                       </div>
                       <div className="md:col-span-2">
                         <p className="text-gray-400 text-sm">Ünvan</p>
                         <p className="text-white">{selectedOrder.user.address || 'Təyin edilməyib'}</p>
                       </div>
                     </div>
                   </div>

                   {/* Məhsullar */}
                   <div className="bg-[#0f172a] rounded-lg p-4">
                     <h3 className="text-lg font-semibold text-white mb-3">Məhsullar ({selectedOrder.items.length})</h3>
                     <div className="space-y-3">
                       {selectedOrder.items.map((item, index) => (
                         <div key={item.id} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg">
                           <div className="flex-1">
                             <div className="flex items-center gap-3">
                               <span className="text-gray-400 text-sm">#{index + 1}</span>
                               <div>
                                 <h4 className="text-white font-medium">{item.name}</h4>
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
                       ))}
                     </div>
                   </div>

                   {/* Düymələr */}
                   <div className="flex justify-end gap-3">
                                         <button
                      onClick={() => printOrder({
                        id: selectedOrder.id,
                        orderNumber: selectedOrder.orderNumber,
                        status: selectedOrder.status,
                        totalAmount: selectedOrder.totalAmount,
                        currency: selectedOrder.currency,
                        itemsCount: selectedOrder.items.length,
                        createdAt: selectedOrder.createdAt,
                        updatedAt: selectedOrder.updatedAt
                      })}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded transition"
                    >
                      🖨️ Çap et
                    </button>
                     <button
                       onClick={closeOrderModal}
                       className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                     >
                       Bağla
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 } 