'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
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
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const { user, isAuthenticated, isApproved, calculateDiscountedPrice } = useAuth();
  const { cartItems, totalPrice, totalSalePrice, savings, clearCart, refreshCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSystems, setPaymentSystems] = useState<Record<string, any>>({});
  const [selectedPaymentSystem, setSelectedPaymentSystem] = useState<string>('');

  useEffect(() => {
    const loadPaymentSystems = async () => {
      try {
        const res = await fetch('/api/payments?action=get_systems', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPaymentSystems(data.systems || {});
        }
      } catch (_e) {
        // ignore
      }
    };
    loadPaymentSystems();
  }, []);

  const handleCreatePayment = async () => {
    if (!order || !user) return;
    if (!selectedPaymentSystem) {
      alert('Выберите способ оплаты');
      return;
    }
    try {
      const res = await fetch('/api/payments?action=create_payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          userId: user.id,
          amount: order.totalAmount,
          paymentSystem: selectedPaymentSystem
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = data.payment.paymentUrl;
      } else {
        alert(data.error || 'Ошибка создания платежа');
      }
    } catch (_e) {
      alert('Ошибка создания платежа');
    }
  };

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

    // Classic invoice layout (as in provided sample). We generate this first and return.
    const vatRate = 20; // 20% VAT included in price
    const totalAmountAll = Number(order?.totalAmount || 0);
    const vatIncludedTotalAll = Number(((totalAmountAll * vatRate) / (100 + vatRate)).toFixed(2));
    const totalWithoutVatAll = Number((totalAmountAll - vatIncludedTotalAll).toFixed(2));
    const validUntil = (() => {
      const d = order?.createdAt ? new Date(order.createdAt) : new Date();
      d.setDate(d.getDate() + 5);
      return d.toLocaleDateString('ru-RU');
    })();

    const classicHTML = `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <title>Счет на оплату ${order?.orderNumber || ''}</title>
      <style>
        @page { size: A4; margin: 1.5cm; }
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 12px; color: #000; }
        .note { font-size: 10px; text-align: center; margin-bottom: 6px; }
        .sample { font-size: 10px; text-align: center; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; }
        .bank td { border: 1px solid #000; padding: 4px 6px; }
        .bank .left { width: 60%; }
        .bank .right { width: 40%; }
        .title { font-weight: bold; font-size: 16px; margin: 12px 0 8px 0; }
        .bold { font-weight: bold; }
        .items th, .items td { border: 1px solid #000; padding: 6px; }
        .items th { background: #f0f0f0; text-align: center; }
        .flex { display: flex; justify-content: space-between; }
        .sign { display: flex; justify-content: space-between; margin-top: 24px; }
        .line { display: inline-block; width: 220px; height: 14px; border-bottom: 1px solid #000; }
        .footer { font-size: 10px; text-align: center; margin-top: 10px; }
      </style></head><body>
        <div class="note">Внимание! Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.</div>
        <div class="sample">Образец заполнения платежного поручения</div>
        <table class="bank">
          <tr>
            <td class="left">
              <div class="bold" style="font-size:10px">Банк получателя</div>
              <div>${companySettings.bankName}</div>
              <div style="font-size:10px">ИНН ${companySettings.inn} КПП ${companySettings.kpp}</div>
              <div style="font-size:10px">Получатель</div>
              <div>${companySettings.companyName}</div>
            </td>
            <td class="right">
              <div class="flex"><span style="font-size:10px">БИК</span><span>${companySettings.bankBik}</span></div>
              <div class="flex"><span style="font-size:10px">Сч. №</span><span>${companySettings.bankAccountNumber}</span></div>
              <div class="flex"><span style="font-size:10px">КПП</span><span>${companySettings.kpp}</span></div>
              <div class="flex"><span style="font-size:10px">Сч. №</span><span>${companySettings.accountNumber}</span></div>
            </td>
          </tr>
        </table>

        <div class="title">Счет на оплату № ${order?.orderNumber || ''} от ${order?.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU')}</div>

        <table style="margin-bottom:8px;">
          <tr>
            <td style="width:110px" class="bold">Поставщик:</td>
            <td>ИНН ${companySettings.inn}, КПП ${companySettings.kpp}, ${companySettings.companyName}, ${companySettings.companyAddress}</td>
          </tr>
          <tr>
            <td class="bold">Покупатель:</td>
            <td>${(user as any)?.inn ? `ИНН ${(user as any).inn}, ` : ''}${(user as any)?.name || `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`}, ${(user as any)?.country || ''} ${(user as any)?.city || ''}, ${(user as any)?.address || ''}</td>
          </tr>
        </table>

        <div style="font-size:10px">Действителен до ${validUntil}</div>

        <table class="items" style="margin-top:8px;">
          <thead>
            <tr>
              <th style="width:30px;">№</th>
              <th>Товар</th>
              <th style="width:90px;">Код</th>
              <th style="width:60px;">Кол-во</th>
              <th style="width:50px;">Ед.</th>
              <th style="width:80px;">Цена</th>
              <th style="width:90px;">в т.ч. НДС</th>
              <th style="width:90px;">Всего</th>
            </tr>
          </thead>
          <tbody>
            ${(order?.items || []).map((item, idx) => {
              const itemTotal = Number(item.totalPrice || (item.price * item.quantity));
              const itemVat = Number(((itemTotal * vatRate) / (100 + vatRate)).toFixed(2));
              return `<tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${item.name}</td>
                <td>${(item as any).artikul || item.sku || ''}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:center;">шт</td>
                <td style="text-align:right;">${Number(item.price).toFixed(2)}</td>
                <td style="text-align:right;">${itemVat.toFixed(2)}</td>
                <td style="text-align:right;">${itemTotal.toFixed(2)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <div style="margin-top:8px; text-align:right;">
          <div>Итого НДС: <strong>${vatIncludedTotalAll.toFixed(2)}</strong></div>
          <div>Итого без НДС: <strong>${totalWithoutVatAll.toFixed(2)}</strong></div>
          <div style="font-size:14px; margin-top:6px;">Итого к оплате: <strong>${totalAmountAll.toFixed(2)} RUB</strong></div>
        </div>

        <div class="sign">
          <div>Руководитель <span class="line"></span></div>
          <div>Бухгалтер <span class="line"></span></div>
        </div>

        <div class="footer">Внимание! Товар в поврежденной, грязной упаковке или без упаковки возврату не подлежит!</div>
      </body></html>`;

    printWindow.document.write(classicHTML);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
    return;

    // (Legacy template removed; the classic layout above is now the only output)
  };

  const downloadPdf = async () => {
    try {
      const element = invoiceRef.current;
      if (!element) return;
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf') as any
      ]);
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`invoice_${order?.orderNumber || 'order'}.pdf`);
    } catch (e) {
      alert('Не удалось сохранить PDF');
    }
  };

  const continueShopping = () => {
    router.push('/catalog');
  };

  const confirmOrder = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // If order already exists (navigated from created order), do not create a duplicate
      if (order && order.id) {
        setIsConfirmed(true);
        await clearCart();
        await refreshCart();
        return;
      }

      if (!cartItems || cartItems.length === 0) {
        setError('Səbətdə məhsul yoxdur');
        return;
      }

      const items = cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        sku: item.sku || '',
        categoryName: item.categoryName || ''
      }));

      const orderNumber = `SADO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const totalAmount = isApproved && user && (user as any).discountPercentage > 0 ? totalSalePrice : totalPrice;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          items,
          totalAmount,
          notes: 'Заказ создан из счета',
          orderNumber
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsConfirmed(true);
        await clearCart();
        await refreshCart();
      } else {
        setError(data.error || 'Sifariş təsdiqlənərkən xəta baş verdi');
      }
    } catch (error) {
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
                onClick={() => {
                  console.log('Navigating to profile orders tab...');
                  router.push('/profile?tab=orders');
                }}
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
      <div ref={invoiceRef} className="invoice-content max-w-4xl mx-auto p-4 md:p-8 bg-white">
        {/* Invoice Title */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-3 md:mb-4">СЧЕТ-ФАКТУРА</h2>
          <div className="text-base md:text-lg text-gray-600 mb-2">№ {order.orderNumber}</div>
          <div className="text-base md:text-lg text-gray-600">от {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU')}</div>
        </div>

        {/* Supplier and Buyer Info */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300 mb-4 text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left w-1/2">Поставщик:</th>
                <th className="border border-gray-300 p-3 text-left w-1/2">Покупатель:</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3 align-top">
                  <div className="space-y-1">
                    <p className="font-semibold">{companySettings.companyName}</p>
                    <p>{companySettings.companyAddress}</p>
                    <p>ИНН: {companySettings.inn}</p>
                    <p>КПП: {companySettings.kpp}</p>
                    <p>БИК: {companySettings.bik}</p>
                    <p>Счет №: {companySettings.accountNumber}</p>
                    <p>Банк: {companySettings.bankName}</p>
                    <p>БИК банка: {companySettings.bankBik}</p>
                    <p>Корр. счет: {companySettings.bankAccountNumber}</p>
                  </div>
                </td>
                <td className="border border-gray-300 p-3 align-top">
                  <div className="space-y-1">
                    <p className="font-semibold">{(user as any)?.name || `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`}</p>
                    <p>ИНН: {(user as any)?.inn || 'Не указан'}</p>
                    <p>Страна: {(user as any)?.country || 'Не указана'}</p>
                    <p>Город: {(user as any)?.city || 'Не указан'}</p>
                    <p>Адрес: {(user as any)?.address || 'Не указан'}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Products Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300 text-xs md:text-sm">
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
                  <td className="border border-gray-300 p-2">{(item as any).artikul || item.sku || ''}</td>
                  <td className="border border-gray-300 p-2">{item.quantity}</td>
                  <td className="border border-gray-300 p-2">шт.</td>
                  <td className="border border-gray-300 p-2">{item.price.toLocaleString('ru-RU')} ₽</td>
                  <td className="border border-gray-300 p-2">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Способ оплаты</h3>
          <div className="space-y-3">
            {Object.entries(paymentSystems).map(([key, ps]: any) => (
              <div
                key={key}
                className={`flex items-center justify-between p-3 border rounded cursor-pointer ${selectedPaymentSystem === key ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onClick={() => setSelectedPaymentSystem(key)}
              >
                <div>
                  <div className="font-medium">{ps.name}</div>
                  <div className="text-sm text-gray-600">{ps.description}</div>
                </div>
                <div className="text-sm text-gray-600">Комиссия: {ps.commission}%</div>
              </div>
            ))}
          </div>
          <button
            onClick={handleCreatePayment}
            disabled={!selectedPaymentSystem}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            Оплатить
          </button>
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
      {/* Actions: download PDF */}
      <div className="print:hidden max-w-4xl mx-auto p-4 flex justify-end">
        <button onClick={downloadPdf} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">Скачать PDF</button>
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