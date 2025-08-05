'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import { useCart } from '../../components/CartProvider';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  salePrice: number;
  images: string[];
  stock: number;
  sku: string;
  categoryName: string;
  quantity: number;
  totalPrice: number;
  totalSalePrice: number;
  createdAt: string;
}

interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalSalePrice: number;
  savings: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { cartItems, cartItemsCount, totalPrice, totalSalePrice, savings, refreshCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Use CartProvider data instead of fetching separately
    if (cartItems.length > 0) {
      setCart({
        items: cartItems,
        totalItems: cartItemsCount,
        totalPrice: totalPrice,
        totalSalePrice: totalSalePrice,
        savings: savings
      });
      setIsLoadingCart(false);
    } else {
      // Fallback to API fetch if CartProvider has no data
      fetchCart();
    }
  }, [isAuthenticated, user?.id, cartItems, cartItemsCount, totalPrice, totalSalePrice, savings]);

  const fetchCart = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/cart?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setCart(data.cart);
      } else {
        console.error('Cart fetch failed:', data.error);
        setCart({ items: [], totalItems: 0, totalPrice: 0, totalSalePrice: 0, savings: 0 });
      }
    } catch (error) {
      console.error('Səbət məlumatlarını əldə etmə xətası:', error);
      setCart({ items: [], totalItems: 0, totalPrice: 0, totalSalePrice: 0, savings: 0 });
    } finally {
      setIsLoadingCart(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity })
      });
      
      if (response.ok) {
        fetchCart(); // Səbəti yenilə
      }
    } catch (error) {
      console.error('Miqdar yeniləmə xətası:', error);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/cart?cartItemId=${cartItemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchCart(); // Səbəti yenilə
      }
    } catch (error) {
      console.error('Məhsul silmə xətası:', error);
    }
  };

  const generateInvoice = (orderData: any) => {
    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Счет на оплату - ${orderData.orderNumber}</title>
          <style>
            @media print {
              body {
                width: 210mm;
                min-height: 297mm;
                margin: 15mm auto;
                background: white;
                color: black;
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
              }
              .header, .footer {
                page-break-inside: avoid;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11pt;
              }
              th, td {
                border: 1px solid #000;
                padding: 4px 6px;
                text-align: left;
              }
              .signatures {
                margin-top: 30mm;
                display: flex;
                justify-content: space-between;
              }
            }
            body {
              width: 210mm;
              min-height: 297mm;
              margin: 15mm auto;
              background: white;
              color: black;
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
            }
            .header, .footer {
              page-break-inside: avoid;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 6px;
              text-align: left;
            }
            .signatures {
              margin-top: 30mm;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Счет на оплату № ${orderData.orderNumber} от ${new Date().toLocaleDateString('ru-RU')}</h1>
          </div>
          <div class="info-row">
            <div class="info-block">
              <div class="section-title">Банк получателя:</div>
              <p>АО "ТБанк" г. Москва</p>
              <p>Получатель: ООО "САДО-ПАРТС"</p>
              <p>ИНН 9718265289, КПП 772301001</p>
              <p>БИК: 044525974</p>
              <p>Сч. №: 30101810145250000974</p>
              <p>Сч. №: 40702810510001663495</p>
            </div>
            <div class="info-block">
              <div class="section-title">Поставщик:</div>
              <p>ООО "САДО-ПАРТС", ИНН 9718265289, КПП 772301001</p>
              <p>109383, Москва, проезд Батюнинский, д. 11, стр. 1</p>
              <p>тел.: +7 (499) 391-05-02</p>
              <div class="section-title" style="margin-top:6px;">Покупатель:</div>
              <p>${orderData.customer?.firstName || 'Иван'} ${orderData.customer?.lastName || 'Петров'}</p>
              <p>Email: ${orderData.customer?.email || 'customer@example.com'}</p>
              <p>Телефон: ${orderData.customer?.phone || '+7 (999) 123-45-67'}</p>
            </div>
          </div>
          <div class="info-row" style="margin-bottom:4px;">
            <div class="info-block" style="width:100%;">
              <span class="section-title">Основание:</span> № ${orderData.orderNumber} от ${new Date().toLocaleDateString('ru-RU')}
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Товар (Услуга)</th>
                  <th>Код</th>
                  <th>Кол-во</th>
                  <th>Ед.</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.sku || 'N/A'}</td>
                    <td>${item.quantity}</td>
                    <td>шт</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <table>
            <tr class="total-row">
              <td colspan="6" style="text-align:right;">Итого:</td>
              <td>${orderData.totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="6" style="text-align:right;">Без налога (НДС):</td>
              <td>-</td>
            </tr>
            <tr class="total-row">
              <td colspan="6" style="text-align:right;">Всего к оплате:</td>
              <td>${orderData.totalAmount.toFixed(2)} ₽</td>
            </tr>
          </table>
          <div class="amount-words">
            <strong>Всего наименований ${orderData.items.length}, на сумму ${orderData.totalAmount.toFixed(2)} руб.</strong><br/>
            <strong>${numberToWords(orderData.totalAmount)} рублей 00 копеек</strong>
          </div>
          <div class="terms">
            <strong>Условия оплаты:</strong> Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно. Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.
          </div>
          <div class="signatures">
            <div class="sign-block">
              <div class="sign-line"></div>
              подпись<br/>Гасанов Р. Д.<br/><span style="font-size:9px;">расшифровка подписи</span>
            </div>
            <div class="sign-block">
              <div class="sign-line"></div>
              подпись<br/>Гасанов Р. Д.<br/><span style="font-size:9px;">расшифровка подписи</span>
            </div>
            <div class="sign-block">
              М.П.
            </div>
          </div>
          <div class="footer">Гасанов Руфат Давудович</div>
        </body>
        </html>
      `);
      invoiceWindow.document.close();
      invoiceWindow.print();
    }
  };

  const numberToWords = (num: number) => {
    const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    
    if (num === 0) return 'ноль';
    
    const integerPart = Math.floor(num);
    let result = '';
    
    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      if (thousands === 1) {
        result += 'одна тысяча ';
      } else if (thousands >= 2 && thousands <= 4) {
        result += ones[thousands] + ' тысячи ';
      } else {
        result += ones[thousands] + ' тысяч ';
      }
    }
    
    const hundreds = Math.floor((integerPart % 1000) / 100);
    if (hundreds > 0) {
      result += ones[hundreds] + 'сот ';
    }
    
    const remainder = integerPart % 100;
    if (remainder >= 20) {
      result += tens[Math.floor(remainder / 10)] + ' ';
      if (remainder % 10 > 0) {
        result += ones[remainder % 10] + ' ';
      }
    } else if (remainder >= 10) {
      result += teens[remainder - 10] + ' ';
    } else if (remainder > 0) {
      result += ones[remainder] + ' ';
    }
    
    return result.trim();
  };

  const handleCheckout = async () => {
    if (!user?.id || !cart) {
      alert('Səbət məlumatları tapılmadı');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Sifariş yarat
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          notes: 'Səbətdən yaradılmış sifariş'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Sifariş uğurla yaradıldı
        setIsLoading(false);
        
        // Hesab-faktura səhifəsinə yönləndir
        router.push(`/invoice?orderId=${data.order.id}`);
        
      } else {
        throw new Error(data.error || 'Sifariş yaratma xətası');
      }
      
    } catch (error) {
      console.error('Sifariş xətası:', error);
      setIsLoading(false);
      alert('Sifariş yaratma zamanı xəta baş verdi. Yenidən cəhd edin.');
    }
  };

  if (isLoadingCart) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 neon-text">Səbət</h1>
          <div className="bg-white/10 rounded-xl p-8 text-center shadow-lg">
            <div className="text-2xl">Yüklənir...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 neon-text">Səbət</h1>
          
          <div className="bg-white/10 rounded-xl p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-4">Səbət boşdur</h2>
            <p className="text-lg mb-6">Sifariş vermək üçün kataloqdan məhsul əlavə edin</p>
            <Link 
              href="/catalog" 
              className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition"
            >
              Kataloqa keç
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 neon-text">Səbət</h1>
        
        <div className="bg-white/10 rounded-xl p-6 shadow-lg">
          {/* Məhsullar siyahısı */}
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-300">Artikul: {item.sku}</p>
                  <p className="text-sm text-gray-300">
                    Qiymət: {item.salePrice < item.price ? (
                      <span>
                        <span className="line-through text-gray-400">{item.price.toLocaleString()}</span>
                        <span className="text-green-400 ml-2">{item.salePrice.toLocaleString()}</span>
                      </span>
                    ) : (
                      item.price.toLocaleString()
                    )} ₼
                  </p>
                  <p className="text-sm text-gray-300">Kateqoriya: {item.categoryName}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 rounded bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-8 h-8 rounded bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {item.totalSalePrice.toLocaleString()} ₼
                    </div>
                    {item.salePrice < item.price && (
                      <div className="text-sm text-green-400">
                        {item.totalPrice - item.totalSalePrice} ₼ qənaət
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Ümumi */}
          <div className="border-t border-white/20 pt-6 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span>Məhsullar: {cart.totalItems}</span>
                <span>Ümumi: {cart.totalPrice.toLocaleString()} ₼</span>
              </div>
              {cart.savings > 0 && (
                <div className="flex justify-between items-center text-green-400">
                  <span>Qənaət:</span>
                  <span>-{cart.savings.toLocaleString()} ₼</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold border-t border-white/20 pt-2">
                <span>Ödəniləcək:</span>
                <span>{cart.totalSalePrice.toLocaleString()} ₼</span>
              </div>
            </div>
          </div>
          
          {/* Düymələr */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/catalog" 
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-cyan-600 font-semibold text-center transition"
            >
              Alış-verişə davam et
            </Link>
            
            <Link 
              href="/profile" 
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-cyan-600 font-semibold text-center transition"
            >
              Mənim profilim
            </Link>
            
            <button 
              onClick={handleCheckout}
              disabled={isLoading}
              className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition disabled:opacity-50 flex-1"
            >
              {isLoading ? 'Sifariş yaradılır...' : 'Sifariş ver və hesab-faktura al'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 