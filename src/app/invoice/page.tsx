'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
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

function InvoiceContent() {
  const { user, isAuthenticated, isApproved, calculateDiscountedPrice } = useAuth();
  const { cartItems, totalPrice, totalSalePrice, savings } = useCart();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to convert number to Russian text
  const numberToRussianText = (num: number): string => {
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
    
    if (num === 0) return 'ноль';
    
    let rubles = Math.floor(num);
    let kopecks = Math.round((num - rubles) * 100);
    
    let result = '';
    
    if (rubles > 0) {
      if (rubles >= 1000) {
        const thousands = Math.floor(rubles / 1000);
        if (thousands === 1) {
          result += 'одна тысяча ';
        } else if (thousands < 5) {
          result += numberToRussianText(thousands) + ' тысячи ';
        } else {
          result += numberToRussianText(thousands) + ' тысяч ';
        }
        rubles %= 1000;
      }
      
      if (rubles >= 100) {
        result += hundreds[Math.floor(rubles / 100)] + ' ';
        rubles %= 100;
      }
      
      if (rubles >= 20) {
        result += tens[Math.floor(rubles / 10)] + ' ';
        rubles %= 10;
      } else if (rubles >= 10) {
        result += teens[rubles - 10] + ' ';
        rubles = 0;
      }
      
      if (rubles > 0) {
        result += units[rubles] + ' ';
      }
      
      // Proper grammar for rubles
      const originalRubles = Math.floor(num);
      const lastDigit = originalRubles % 10;
      const lastTwoDigits = originalRubles % 100;
      
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        result += 'рублей ';
      } else if (lastDigit === 1) {
        result += 'рубль ';
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        result += 'рубля ';
      } else {
        result += 'рублей ';
      }
    }
    
    if (kopecks > 0) {
      if (kopecks >= 20) {
        result += tens[Math.floor(kopecks / 10)] + ' ';
        kopecks %= 10;
      } else if (kopecks >= 10) {
        result += teens[kopecks - 10] + ' ';
        kopecks = 0;
      }
      
      if (kopecks > 0) {
        result += units[kopecks] + ' ';
      }
      
      // Proper grammar for kopecks
      const originalKopecks = Math.round((num - Math.floor(num)) * 100);
      const lastDigit = originalKopecks % 10;
      const lastTwoDigits = originalKopecks % 100;
      
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        result += 'копеек';
      } else if (lastDigit === 1) {
        result += 'копейка';
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        result += 'копейки';
      } else {
        result += 'копеек';
      }
    } else {
      result += '00 копеек';
    }
    
    return result.trim();
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadOrderData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('orderId');

      if (orderId) {
        // Load order from API
        try {
          const response = await fetch(`/api/orders/${orderId}`);
          if (response.ok) {
            const orderData = await response.json();
            // API returns array, so take first item
            const order = Array.isArray(orderData) ? orderData[0] : orderData.order;
            setOrder(order);
            setLoading(false);
          } else {
            setError('Sifariş tapılmadı');
            setLoading(false);
          }
        } catch (error) {
          setError('Sifariş yüklənərkən xəta baş verdi');
          setLoading(false);
        }
      } else {
        // Create invoice from cart (fallback)
        if (!cartItems || cartItems.length === 0) {
          setError('Səbətdə məhsul yoxdur');
          setLoading(false);
          return;
        }

        const timestamp = Date.now();
        const orderNumber = `SIF-${String(timestamp).slice(-8)}`;

        const invoiceOrder: Order = {
          id: `invoice-${timestamp}`,
          orderNumber: orderNumber,
          status: 'pending',
          totalAmount: isApproved && user && user.discountPercentage > 0 ? totalSalePrice : totalPrice,
          currency: 'RUB',
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: cartItems.map((item, index) => ({
            id: `item-${index}`,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: isApproved && user && user.discountPercentage > 0 ? 
              calculateDiscountedPrice(item.price, null) * item.quantity : 
              item.totalPrice,
            sku: item.sku,
            categoryName: item.categoryName
          }))
        };

        setOrder(invoiceOrder);
        setLoading(false);
      }
    };

    loadOrderData();
  }, [cartItems, isAuthenticated, isApproved, user, totalPrice, totalSalePrice, calculateDiscountedPrice, router]);

  const printInvoice = () => {
    window.print();
  };

  const continueShopping = () => {
    router.push('/catalog');
  };

  const confirmOrder = async () => {
    if (!order || !user) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Starting checkout process...');
      console.log('User ID:', user.id);
      console.log('cart items count:', cartItems.length);
      console.log('cart items:', cartItems);
      console.log('Valid cart items:', cartItems.filter(item => item && item.productId && item.name));
      
      const orderData = {
        userId: user.id,
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
          sku: item.sku || '',
          categoryName: item.categoryName || ''
        })),
        totalAmount: order.totalAmount,
        notes: order.notes || '',
        orderNumber: order.orderNumber
      };
      
      console.log('Order data being sent:', orderData);
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('Order response status:', response.status);
      const responseData = await response.json();
      console.log('Order response data:', responseData);
      
      if (response.ok) {
        setIsConfirmed(true);
        // Clear cart after successful order
        await fetch('/api/cart/clear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });
      } else {
        console.error('Order creation failed:', responseData.error);
        setError(`Sifariş xatası: ${responseData.error || 'Sifariş təsdiqlənərkən xəta baş verdi'}`);
      }
    } catch (error) {
      console.error('Order confirmation error:', error);
      setError('Sifariş təsdiqlənərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Hesab faktura hazırlanır...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={goBack}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Geri qayıt
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Sifariş məlumatları tapılmadı</p>
          <button
            onClick={goBack}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Geri qayıt
          </button>
        </div>
      </div>
    );
  }

  const currentDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const totalAmount = order.totalAmount;
  const totalAmountText = totalAmount.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sifariş Təsdiqləndi!</h2>
          <p className="text-gray-600 mb-6">
            Sifariş nömrəniz: <strong>{order.orderNumber}</strong>
          </p>
          <p className="text-gray-600 mb-6">
            Sifarişiniz uğurla qeydə alındı və admin tərəfindən təsdiqlənməyi gözləyir.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/profile/orders')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Sifarişlərimə bax
            </button>
            <button
              onClick={continueShopping}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700"
            >
              Alış-verişə davam et
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Action Buttons - Only visible when not printing */}
      <div className="print:hidden bg-gray-100 p-4 border-b">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={goBack}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Geri qayıt
            </button>
            <button
              onClick={continueShopping}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Alış-verişə davam et
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={printInvoice}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Çap et
            </button>
            <button
              onClick={confirmOrder}
              disabled={isSubmitting}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Təsdiqlənir...' : 'Təsdiqlə'}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Header with Logo and Bank Details */}
        <div className="flex justify-between items-start mb-8">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">BILAL-PARTS</h1>
            </div>
          </div>

          {/* Bank Details */}
          <div className="text-right text-sm">
            <div className="border border-gray-300 p-3 mb-3">
              <p><strong>ООО "Банк Точка" г. Москва</strong></p>
              <p>БИК: 044525104</p>
              <p>Сч. №: 30101810745374525104</p>
            </div>
            <div className="border border-gray-300 p-3">
              <p><strong>Банк получателя</strong></p>
              <p>ИНН: 9718265289</p>
              <p>КПП: 772301001</p>
              <p>Сч. №: 40702810620000183270</p>
              <p><strong>ООО "БИЛАЛ-ПАРТС"</strong></p>
            </div>
            <div className="mt-3">
              <p><strong>Получатель:</strong></p>
              <p className="border-b border-gray-300 min-h-[20px]"></p>
            </div>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Счет на оплату № {order.orderNumber} от {currentDate}</h2>
        </div>

        {/* Supplier and Buyer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Поставщик:</h3>
            <p className="font-semibold">ООО "БИЛАЛ-ПАРТС"</p>
            <p>ИНН: 9718265289</p>
            <p>КПП: 772301001</p>
            <p>109383, Город Москва, вн.тер. г. Муниципальный Округ Печатники, проезд Батюнинский, дом 11, строение 1,</p>
            <p><strong>(исполнитель):</strong> тел.: +7 (499)391-05-02</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Покупатель:</h3>
            <p className="border-b border-gray-300 min-h-[20px] mb-2"></p>
            <p><strong>(заказчик):</strong></p>
            <p className="border-b border-gray-300 min-h-[20px]"></p>
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">№</th>
                <th className="border border-gray-300 p-2 text-left">Товар (Услуга)</th>
                <th className="border border-gray-300 p-2 text-left">Код</th>
                <th className="border border-gray-300 p-2 text-left">Кол-во</th>
                <th className="border border-gray-300 p-2 text-left">Ед.</th>
                <th className="border border-gray-300 p-2 text-left">Цена</th>
                <th className="border border-gray-300 p-2 text-left">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 p-2">{index + 1}</td>
                  <td className="border border-gray-300 p-2">{item.name}</td>
                  <td className="border border-gray-300 p-2">{item.sku}</td>
                  <td className="border border-gray-300 p-2">{item.quantity}</td>
                  <td className="border border-gray-300 p-2">шт.</td>
                  <td className="border border-gray-300 p-2">{item.price.toLocaleString('ru-RU')} ₽</td>
                  <td className="border border-gray-300 p-2">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between border-b border-gray-300 py-2">
                <span><strong>Итого:</strong></span>
                <span>{totalAmountText} ₽</span>
              </div>
              <div className="flex justify-between border-b border-gray-300 py-2">
                <span>Без налога (НДС):</span>
                <span>{totalAmountText} ₽</span>
              </div>
              <div className="flex justify-between py-2">
                <span><strong>Всего к оплате:</strong></span>
                <span><strong>{totalAmountText} ₽</strong></span>
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <p>Всего наименований {order.items.length}, на сумму {totalAmountText} ₽</p>
            <p className="font-semibold">{numberToRussianText(totalAmount)}</p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8 text-sm">
          <p>Оплата данного счета означает согласие с условиями поставки товара.</p>
          <p>Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе.</p>
          <p>Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.</p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between">
          <div className="w-48">
            <div className="border-b border-gray-300 mb-2 min-h-[30px]"></div>
            <p><strong>Руководитель</strong></p>
            <p>подпись</p>
            <p className="mt-4">Гасанов Р. Д.</p>
            <p>расшифровка подписи</p>
          </div>
          <div className="w-48">
            <div className="border-b border-gray-300 mb-2 min-h-[30px]"></div>
            <p><strong>Бухгалтер</strong></p>
            <p>подпись</p>
            <p className="mt-4">Гасанов Р. Д.</p>
            <p>расшифровка подписи</p>
          </div>
          <div className="w-48">
            <div className="border border-gray-300 h-16 flex items-center justify-center">
              <p className="text-sm">М.П.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-right mt-8">
          <p className="text-sm">Лаиджов Садиг</p>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return <InvoiceContent />;
} 