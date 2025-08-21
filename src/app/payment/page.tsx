'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import { useCart } from '../../components/CartProvider';
// Dynamic imports for icons to reduce initial bundle size
import dynamic from 'next/dynamic';

// Lazy load icons
const DynamicIcons = {
  FaCreditCard: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaCreditCard })), {
    loading: () => <span>💳</span>,
    ssr: false
  }),
  FaWallet: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaWallet })), {
    loading: () => <span>💰</span>,
    ssr: false
  }),
  FaMobile: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaMobile })), {
    loading: () => <span>📱</span>,
    ssr: false
  }),
  FaArrowLeft: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaArrowLeft })), {
    loading: () => <span>←</span>,
    ssr: false
  }),
  FaCheck: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaCheck })), {
    loading: () => <span>✓</span>,
    ssr: false
  }),
  FaTimes: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaTimes })), {
    loading: () => <span>✗</span>,
    ssr: false
  }),
};

interface PaymentSystem {
  name: string;
  icon: string;
  description: string;
  commission: number;
  minAmount: number;
  maxAmount: number;
}

interface PaymentSystems {
  [key: string]: PaymentSystem;
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { cartItems, totalSalePrice, clearCart } = useCart();
  
  const [paymentSystems, setPaymentSystems] = useState<PaymentSystems>({});
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [userInn, setUserInn] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      setOrderId(orderIdParam);
      fetchOrderDetails(orderIdParam);
    }

    fetchPaymentSystems();
    fetchUserInn();
  }, [isAuthenticated, router, searchParams]);

  const fetchPaymentSystems = async () => {
    try {
      const response = await fetch('/api/payments?action=get_systems');
      if (response.ok) {
        const data = await response.json();
        setPaymentSystems(data.systems);
      }
    } catch (error) {
      console.error('Ошибка получения платежных систем:', error);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.order);
      }
    } catch (error) {
      console.error('Ошибка получения деталей заказа:', error);
    }
  };

  const fetchUserInn = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUserInn(data.user?.inn || '');
      }
    } catch (error) {
      console.error('Ошибка получения ИНН пользователя:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedSystem || !orderId) {
      alert('Выберите способ оплаты');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments?action=create_payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: parseInt(orderId),
          userId: user?.id,
          amount: orderDetails?.totalAmount || totalSalePrice,
          paymentSystem: selectedSystem
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentUrl(data.payment.paymentUrl);
        
        // Ödəniş səhifəsinə yönləndir
        window.location.href = data.payment.paymentUrl;
      } else {
        const error = await response.json();
        alert(`Ошибка создания платежа: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      alert('Ошибка создания платежа');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <DynamicIcons.FaCheck className="text-green-500" />;
      case 'cancelled':
        return <DynamicIcons.FaTimes className="text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В ожидании';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      case 'refunded':
        return 'Возвращен';
      default:
        return status;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <DynamicIcons.FaArrowLeft className="mr-2" />
            Назад
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Оплата заказа
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Выберите удобный способ оплаты
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ödəniş sistemləri */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Способы оплаты
              </h2>

              <div className="space-y-4">
                {Object.entries(paymentSystems).map(([key, system]) => {
                  // Bank köçürməsi üçün INN yoxlaması
                  const isBankTransfer = key === 'bank_transfer';
                  const hasInn = userInn && userInn.trim() !== '';
                  const isDisabled = isBankTransfer && !hasInn;
                  
                  return (
                    <div
                      key={key}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        isDisabled
                          ? 'border-gray-300 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                          : selectedSystem === key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer'
                      }`}
                      onClick={() => !isDisabled && setSelectedSystem(key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">{system.icon}</div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {system.name}
                              {isBankTransfer && !hasInn && (
                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  Требуется ИНН
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {system.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Комиссия: {system.commission}%
                            </p>
                            {isBankTransfer && !hasInn && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Добавьте ИНН в профиле для использования банковского перевода
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedSystem === key
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedSystem === key && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedSystem && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Детали платежа
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Сумма заказа:</span>
                      <span className="font-medium">
                        {orderDetails?.totalAmount || totalSalePrice} ₽
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Комиссия:</span>
                      <span className="font-medium">
                        {((orderDetails?.totalAmount || totalSalePrice) * paymentSystems[selectedSystem].commission / 100).toFixed(2)} ₽
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-gray-900 dark:text-white">Итого к оплате:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {((orderDetails?.totalAmount || totalSalePrice) * (1 + paymentSystems[selectedSystem].commission / 100)).toFixed(2)} ₽
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={!selectedSystem || loading}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Обработка...' : 'Оплатить'}
              </button>
            </div>
          </div>

          {/* Sifariş detalları */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Детали заказа
              </h2>

              {orderDetails ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Номер заказа:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {orderDetails.orderNumber}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Статус:</span>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(orderDetails.status)}
                      <span className="ml-2 text-sm font-medium">
                        {getStatusText(orderDetails.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Дата:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(orderDetails.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Сумма:</span>
                    <p className="font-bold text-lg text-blue-600">
                      {orderDetails.totalAmount} ₽
                    </p>
                  </div>

                  {orderDetails.items && orderDetails.items.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Товары:</span>
                      <div className="mt-2 space-y-2">
                        {orderDetails.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-900 dark:text-white">
                              {item.product?.name || 'Товар'} x {item.quantity}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {item.price} ₽
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Сумма корзины:</span>
                    <p className="font-bold text-lg text-blue-600">
                      {totalSalePrice} ₽
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Товары в корзине:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {cartItems.length} шт.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Təhlükəsizlik məlumatı */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <DynamicIcons.FaCheck className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Безопасная оплата
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Все платежи защищены SSL-шифрованием. Ваши данные в безопасности.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">Загрузка...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
