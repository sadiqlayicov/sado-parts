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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const createInvoiceFromCart = () => {
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
    };

    createInvoiceFromCart();
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
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          items: order.items,
          totalAmount: order.totalAmount,
          notes: order.notes || '',
          orderNumber: order.orderNumber
        }),
      });

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
        setError('Sifariş təsdiqlənərkən xəta baş verdi');
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

  const currentDate = new Date().toLocaleDateString('ru-RU');
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">SADO-PARTS</h1>
          <p className="text-gray-600">Запчасти для вилочных погрузчиков в Москве</p>
          <p className="text-gray-600">Интернет-магазин премиум-класса</p>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Поставщик:</h3>
            <p className="font-semibold">ООО "САДО-ПАРТС"</p>
            <p>ИНН: 1234567890</p>
            <p>КПП: 123456789</p>
            <p>Адрес: г. Москва, ул. Примерная, д. 123</p>
            <p>Телефон: +7 (495) 123-45-67</p>
            <p>Email: info@sado-parts.ru</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Покупатель:</h3>
            <p className="font-semibold">{user?.name || 'Физическое лицо'}</p>
            <p>Email: {user?.email || 'Не указан'}</p>
            <p>Телефон: {(user as any)?.phone || 'Не указан'}</p>
            <p>Адрес: {(user as any)?.address || 'Не указан'}</p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p><strong>Счет-фактура №:</strong> {order.orderNumber}</p>
            <p><strong>Дата:</strong> {currentDate}</p>
          </div>
          <div className="text-right">
            <p><strong>Статус:</strong> Ожидает подтверждения</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">№</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Наименование</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Артикул</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Категория</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Кол-во</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Цена (₽)</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Сумма (₽)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.sku}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.categoryName}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {item.price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {item.totalPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="text-right mb-8">
          <div className="inline-block text-left">
            <p className="text-lg"><strong>Итого:</strong> {totalAmountText} ₽</p>
            {savings > 0 && (
              <p className="text-green-600">Скидка: {savings.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽</p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="mb-8 text-sm text-gray-600">
          <h4 className="font-bold mb-2">Условия поставки:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Срок поставки: 1-3 рабочих дня</li>
            <li>Способ оплаты: наличными при получении или банковской картой</li>
            <li>Гарантия: согласно техническим условиям производителя</li>
            <li>Возврат: в течение 14 дней при сохранении товарного вида</li>
          </ul>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="mb-8">Подпись поставщика: _________________</p>
            <p>Дата: {currentDate}</p>
          </div>
          <div>
            <p className="mb-8">Подпись покупателя: _________________</p>
            <p>Дата: {currentDate}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Спасибо за ваш заказ!</p>
          <p>По всем вопросам обращайтесь: +7 (495) 123-45-67</p>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return <InvoiceContent />;
} 