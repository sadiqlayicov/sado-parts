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
  const { user, isAuthenticated, isApproved, calculateDiscountedPrice } = useAuth();
  const { cartItems, totalPrice, totalSalePrice, savings } = useCart();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Create invoice from cart data
    const createInvoiceFromCart = () => {
      if (!cartItems || cartItems.length === 0) {
        setError('Səbətdə məhsul yoxdur');
        setLoading(false);
        return;
      }

      const timestamp = Date.now();
      const orderNumber = `SIF-${String(timestamp).slice(-8)}`;
      const currentDate = new Date().toLocaleDateString('ru-RU');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yüklənir...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Hesab-faktura tapılmadı</div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('ru-RU');
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = order.totalAmount;
  const totalAmountText = totalAmount.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold transition"
          >
            ← Geri
          </button>
          <button
            onClick={printInvoice}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold transition"
          >
            🖨️ Çap et
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          {/* Company Logo and Info */}
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-800 mb-2">BILAL-PARTS</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>ООО "Банк Точка" г. Москва</div>
              <div>БИК: 044525104</div>
              <div>Сч. №: 30101810745374525104</div>
              <div className="mt-2">
                <div>Получатель: ООО "БИЛАЛ-ПАРТС"</div>
                <div>ИНН: 9718265289</div>
                <div>КПП: 772301001</div>
                <div>Сч. №: 40702810620000183270</div>
              </div>
            </div>
          </div>

          {/* Invoice Title */}
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Счет на оплату № {order.orderNumber}
            </h1>
            <div className="text-lg text-gray-600">
              от {currentDate} г.
            </div>
          </div>

          {/* Empty space for balance */}
          <div className="flex-1"></div>
        </div>

        {/* Supplier and Buyer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Supplier */}
          <div>
            <h3 className="font-bold text-lg mb-3">Поставщик (исполнитель):</h3>
            <div className="text-sm space-y-1">
              <div className="font-semibold">ООО "БИЛАЛ-ПАРТС"</div>
              <div>ИНН: 9718265289</div>
              <div>КПП: 772301001</div>
              <div>109383, Город Москва, вн.тер. г. Муниципальный Округ Печатники,</div>
              <div>проезд Батюнинский, дом 11, строение 1</div>
              <div>тел.: +7 (499)391-05-02</div>
            </div>
          </div>

          {/* Buyer */}
          <div>
            <h3 className="font-bold text-lg mb-3">Покупатель (заказчик):</h3>
            <div className="text-sm space-y-1">
              <div className="font-semibold">{user?.name || 'Не указано'}</div>
              <div>Email: {user?.email || 'Не указано'}</div>
                             {user && user.discountPercentage && user.discountPercentage > 0 && (
                 <div className="text-green-600">Скидка: {user.discountPercentage}%</div>
               )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left font-semibold">№</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Товар (Услуга)</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Код</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Кол-во</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Ед.</th>
                <th className="border border-gray-400 px-3 py-2 text-right font-semibold">Цена</th>
                <th className="border border-gray-400 px-3 py-2 text-right font-semibold">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-400 px-3 py-2">{index + 1}</td>
                  <td className="border border-gray-400 px-3 py-2">
                    <div className="font-medium">{item.name}</div>
                    {item.categoryName && (
                      <div className="text-sm text-gray-600">Категория: {item.categoryName}</div>
                    )}
                  </td>
                  <td className="border border-gray-400 px-3 py-2">{item.sku || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center">шт</td>
                  <td className="border border-gray-400 px-3 py-2 text-right">
                    {isApproved && user && user.discountPercentage > 0 ? (
                      <div>
                        <div className="line-through text-gray-500 text-sm">
                          {item.price.toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="text-green-600 font-semibold">
                          {calculateDiscountedPrice(item.price, null).toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    ) : (
                      <div className="font-semibold">
                        {item.price.toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-right font-semibold">
                    {item.totalPrice.toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Итого:</span>
                <span className="font-semibold">{totalAmountText} ₽</span>
              </div>
              <div className="flex justify-between">
                <span>Без налога (НДС):</span>
                <span>-</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-400 pt-2">
                <span>Всего к оплате:</span>
                <span>{totalAmountText} ₽</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4 text-sm">
            Всего наименований {order.items.length}, на сумму {totalAmountText} руб.
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8 text-sm space-y-2">
          <p>Оплата данного счета означает согласие с условиями поставки товара.</p>
          <p>Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе.</p>
          <p>Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.</p>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-3 gap-8">
          <div>
            <div className="mb-8">
              <div className="font-semibold mb-2">Руководитель</div>
              <div className="border-b border-gray-400 h-8 mb-1"></div>
              <div className="text-xs text-gray-600">подпись</div>
              <div className="border-b border-gray-400 h-8 mb-1"></div>
              <div className="text-xs text-gray-600">расшифровка подписи</div>
            </div>
          </div>
          
          <div>
            <div className="mb-8">
              <div className="font-semibold mb-2">Бухгалтер</div>
              <div className="border-b border-gray-400 h-8 mb-1"></div>
              <div className="text-xs text-gray-600">подпись</div>
              <div className="border-b border-gray-400 h-8 mb-1"></div>
              <div className="text-xs text-gray-600">расшифровка подписи</div>
            </div>
          </div>
          
          <div className="flex items-end">
            <div className="w-16 h-16 border-2 border-yellow-400 bg-yellow-100 flex items-center justify-center">
              <div className="text-xs text-gray-600">М.П.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return <InvoiceContent />;
} 