'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

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

function InvoiceContent({ order, companySettings }: { 
  order: Order | null; 
  companySettings: {
    companyName: string;
    companyAddress: string;
    inn: string;
    kpp: string;
    bik: string;
    accountNumber: string;
    bankName: string;
    bankBik: string;
    bankAccountNumber: string;
    directorName: string;
    accountantName: string;
  };
}) {
  const { user, isAuthenticated, isApproved, calculateDiscountedPrice } = useAuth();
  const { cartItems, totalPrice, totalSalePrice, savings } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
            // setOrder(order); // This line is removed as per the edit hint
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

        // setOrder(invoiceOrder); // This line is removed as per the edit hint
        setLoading(false);
      }
    };

    loadOrderData();
  }, [cartItems, isAuthenticated, isApproved, user, totalPrice, totalSalePrice, calculateDiscountedPrice, router]);

  const printInvoice = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Пожалуйста, разрешите всплывающие окна для печати');
      return;
    }

    // Get the invoice content
    const invoiceContent = document.querySelector('.invoice-content');
    if (!invoiceContent) {
      alert('Содержимое счета не найдено');
      return;
    }

    // Create print-friendly HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Счет-фактура ${order?.orderNumber || ''}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              @page { margin: 1cm; }
            }
            body { font-family: Arial, sans-serif; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .order-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total { font-weight: bold; text-align: right; }
            .footer { margin-top: 30px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            ${invoiceContent.innerHTML}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
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
      <div className="invoice-content max-w-4xl mx-auto p-8">
        {/* Company Information */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{companySettings.companyName}</h1>
            <p className="text-gray-600 mb-1">{companySettings.companyAddress}</p>
            <p className="text-gray-600 mb-1">ИНН: {companySettings.inn}</p>
            <p className="text-gray-600 mb-1">КПП: {companySettings.kpp}</p>
            <p className="text-gray-600 mb-1">БИК: {companySettings.bik}</p>
            <p className="text-gray-600">Счет №: {companySettings.accountNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">СЧЕТ-ФАКТУРА</h2>
            <p className="text-gray-600 mb-1">№ {order?.orderNumber || 'N/A'}</p>
            <p className="text-gray-600 mb-1">от {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU')}</p>
          </div>
        </div>

        {/* Supplier and Buyer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-2">Поставщик:</h3>
            <p className="mb-1">{companySettings.companyName}</p>
            <p className="mb-1">{companySettings.companyAddress}</p>
            <p className="mb-1">ИНН: {companySettings.inn}</p>
            <p className="mb-1">КПП: {companySettings.kpp}</p>
            <p className="mb-1">БИК: {companySettings.bik}</p>
            <p className="mb-1">Счет №: {companySettings.accountNumber}</p>
            <p className="mb-1">Банк: {companySettings.bankName}</p>
            <p className="mb-1">БИК банка: {companySettings.bankBik}</p>
            <p>Корр. счет: {companySettings.bankAccountNumber}</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Покупатель:</h3>
            <p className="mb-1">{(user as any)?.name || `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`}</p>
            <p className="mb-1">ИНН: {(user as any)?.inn || 'Не указан'}</p>
            <p className="mb-1">Страна: {(user as any)?.country || 'Не указана'}</p>
            <p className="mb-1">Город: {(user as any)?.city || 'Не указан'}</p>
            <p>Адрес: {(user as any)?.address || 'Не указан'}</p>
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
        <div className="flex justify-between mt-12">
          <div className="text-center">
            <p className="font-bold mb-8">Руководитель</p>
            <div className="border-b border-gray-300 w-32 mb-2"></div>
            <p className="text-sm text-gray-600">{companySettings.directorName}</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-8">Бухгалтер</p>
            <div className="border-b border-gray-300 w-32 mb-2"></div>
            <p className="text-sm text-gray-600">{companySettings.accountantName}</p>
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

function InvoicePageContent() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companySettings, setCompanySettings] = useState({
    companyName: 'ООО "Спецтехника"',
    companyAddress: 'г. Москва, ул. Примерная, д. 123',
    inn: '7707083893',
    kpp: '770701001',
    bik: '044525225',
    accountNumber: '40702810123456789012',
    bankName: 'Сбербанк',
    bankBik: '044525225',
    bankAccountNumber: '30101810200000000225',
    directorName: 'Иванов И.И.',
    accountantName: 'Петрова П.П.'
  });
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load company settings
        const settingsResponse = await fetch('/api/admin/settings');
        const settingsData = await settingsResponse.json();
        
        if (settingsData.success && settingsData.settings) {
          setCompanySettings(settingsData.settings);
        }

        // Load order data if orderId is provided
        if (orderId) {
          const orderResponse = await fetch(`/api/orders/${orderId}`);
          const orderData = await orderResponse.json();
          
          if (orderData.success) {
            setOrder(orderData.order);
          } else {
            setError('Заказ не найден');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return <InvoiceContent order={order} companySettings={companySettings} />;
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <InvoicePageContent />
    </Suspense>
  );
} 