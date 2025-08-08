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

export default function CartPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { user, isAuthenticated, isApproved, calculateDiscountedPrice } = useAuth();
  const { 
    cartItems, 
    cartItemsCount, 
    totalPrice, 
    totalSalePrice, 
    savings, 
    refreshCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoading
  } = useCart();
  const router = useRouter();

  // Function to translate product names and categories from Azerbaijani to Russian
  const translateProductData = (item: any) => {
    const translations: { [key: string]: string } = {
      // Product names
      'Clark Amortizator dəsti': 'Комплект амортизаторов Clark',
      'Dizel Mühərriklər': 'Дизельные двигатели',
      'Hydraulic Sistem': 'Гидравлическая система',
      'Transmission': 'Трансмиссия',
      'Brake Sistemi': 'Тормозная система',
      'Electrical Sistem': 'Электрическая система',
      'Steering Sistem': 'Рулевое управление',
      'Engine Parts': 'Детали двигателя',
      'Hydraulic Systems': 'Гидравлические системы',
      'Tires & Wheels': 'Шины и колеса',
      'Filters': 'Фильтры',
      'Lubricants': 'Смазочные материалы'
    };

    return {
      ...item,
      name: translations[item.name] || item.name,
      categoryName: translations[item.categoryName] || item.categoryName
    };
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user?.id) return;
    
    try {
      console.log('Updating quantity for cartItemId:', cartItemId, 'to quantity:', quantity);
      await updateQuantity(cartItemId, quantity);
      console.log('Quantity updated successfully');
    } catch (error) {
      console.error('Miqdar yeniləmə xətası:', error);
    }
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('Removing cart item:', cartItemId);
      await removeFromCart(cartItemId);
      console.log('Cart item removed successfully');
    } catch (error) {
      console.error('Məhsul silmə xətası:', error);
    }
  };

  const handleClearCart = async () => {
    if (!user?.id) return;
    
    if (!confirm('Səbəti tamamilə təmizləmək istədiyinizə əminsiniz?')) {
      return;
    }
    
    try {
      console.log('Clearing cart for user:', user.id);
      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (response.ok) {
        console.log('Cart cleared successfully');
        await refreshCart(); // Səbəti yenilə
        alert('Səbət uğurla təmizləndi');
      } else {
        console.error('Failed to clear cart');
        alert('Səbəti təmizləmə zamanı xəta baş verdi');
      }
    } catch (error) {
      console.error('Səbət təmizləmə xətası:', error);
      alert('Səbəti təmizləmə zamanı xəta baş verdi');
    }
  };

  const handleCheckout = async () => {
    if (!user?.id || cartItems.length === 0) {
      alert('Данные корзины не найдены');
      return;
    }
    
    console.log('Starting checkout process...');
    console.log('User ID:', user.id);
    console.log('Cart items count:', cartItems.length);
    console.log('Cart items:', cartItems);
    
    // Check if cart items have required data
    const validCartItems = cartItems.filter(item => 
      item.id && item.productId && item.name && item.price && item.quantity
    );
    
    console.log('Valid cart items:', validCartItems);
    
    if (validCartItems.length === 0) {
      alert('В корзине нет корректных данных о товарах');
      return;
    }
    
    setCheckoutLoading(true);
    
    try {
      // Generate order number
      const orderNumber = `SADO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Calculate total amount
      const totalAmount = isApproved && user && user.discountPercentage > 0 
        ? totalSalePrice 
        : totalPrice;
      
      // Transform cart items to order items format
      const items = validCartItems.map(item => {
        const translatedItem = translateProductData(item);
        return {
          productId: item.productId,
          name: translatedItem.name,
          sku: item.sku,
          categoryName: translatedItem.categoryName,
          quantity: item.quantity,
          price: isApproved && user && user.discountPercentage > 0 
            ? calculateDiscountedPrice(item.price, null)
            : item.price,
          totalPrice: isApproved && user && user.discountPercentage > 0 
            ? calculateDiscountedPrice(item.price, null) * item.quantity
            : item.totalPrice
        };
      });
      
      // Sifariş yarat
      const requestBody = {
        userId: user.id,
        items: items,
        totalAmount: totalAmount,
        notes: 'Заказ создан из корзины',
        orderNumber: orderNumber
      };
      
      console.log('Sending order request with body:', requestBody);
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Order response status:', response.status);
      
      const data = await response.json();
      console.log('Order response data:', data);
      
      if (data.success) {
        // Sifariş uğurla yaradıldı
        console.log('Order created successfully:', data.order);
        setCheckoutLoading(false);
        
        // Səbəti təmizləmə - yalnız sifariş tamamlandıqdan sonra
        // Səbəti təmizləmirik, çünki istifadəçi "Alış-verişə davam et" düyməsini basa bilər
        // Səbət yalnız sifariş tamamlandıqdan sonra təmizlənəcək
        
        // Hesab-faktura səhifəsinə yönləndir
        router.push(`/invoice?orderId=${data.order.id}`);
        
      } else {
        console.error('Order creation failed:', data.error);
        throw new Error(data.error || 'Ошибка создания заказа');
      }
      
    } catch (error) {
      console.error('Ошибка заказа:', error);
      setCheckoutLoading(false);
      alert('Произошла ошибка при создании заказа. Попробуйте еще раз.');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 neon-text">Корзина</h1>
          <div className="bg-white/10 rounded-xl p-8 text-center shadow-lg">
            <div className="text-2xl">Загрузка...</div>
          </div>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 neon-text">Корзина</h1>
          
          <div className="bg-white/10 rounded-xl p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-4">Корзина пуста</h2>
            <p className="text-lg mb-6">Добавьте товары из каталога для оформления заказа</p>
            <Link 
              href="/catalog" 
              className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition"
            >
              Перейти в каталог
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 neon-text">Корзина</h1>
        
        <div className="bg-white/10 rounded-xl p-6 shadow-lg">
          {/* Məhsullar siyahısı */}
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => {
              const translatedItem = translateProductData(item);
              return (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{translatedItem.name}</h3>
                    <p className="text-sm text-gray-300">Артикул: {translatedItem.sku}</p>
                    <p className="text-sm text-gray-300">
                      Цена: {isApproved && user && user.discountPercentage > 0 ? (
                        <span>
                          <span className="line-through text-gray-400">{translatedItem.price.toLocaleString()}</span>
                          <span className="text-green-400 ml-2">{calculateDiscountedPrice(translatedItem.price, null).toLocaleString()}</span>
                        </span>
                      ) : (
                        translatedItem.price.toLocaleString()
                      )} ₽
                    </p>
                    <p className="text-sm text-gray-300">Категория: {translatedItem.categoryName}</p>
                  </div>
                
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 rounded bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {isApproved && user && user.discountPercentage > 0 ? 
                          (calculateDiscountedPrice(item.price, null) * item.quantity).toLocaleString() : 
                          item.totalPrice.toLocaleString()
                        } ₽
                      </div>
                      {isApproved && user && user.discountPercentage > 0 && (
                        <div className="text-sm text-green-400">
                          {item.totalPrice - (calculateDiscountedPrice(item.price, null) * item.quantity)} ₽ экономия
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Ümumi */}
          <div className="border-t border-white/20 pt-6 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span>Товары: {cartItemsCount}</span>
                <span>Итого: {totalPrice.toLocaleString()} ₽</span>
              </div>
              {isApproved && user && user.discountPercentage > 0 && (
                <div className="flex justify-between items-center text-green-400">
                  <span>Экономия:</span>
                  <span>-{savings.toLocaleString()} ₽</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold border-t border-white/20 pt-2">
                <span>К оплате:</span>
                <span>{isApproved && user && user.discountPercentage > 0 ? totalSalePrice.toLocaleString() : totalPrice.toLocaleString()} ₽</span>
              </div>
            </div>
          </div>
          
          {/* Düymələr */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/catalog" 
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-cyan-600 font-semibold text-center transition"
            >
              Продолжить покупки
            </Link>
            
            <Link 
              href="/profile" 
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-cyan-600 font-semibold text-center transition"
            >
              Мой профиль
            </Link>
            
            <button 
              onClick={handleClearCart}
              className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 font-semibold text-center transition"
            >
              Очистить корзину
            </button>
            
            <button 
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition disabled:opacity-50 flex-1"
            >
              {checkoutLoading ? 'Создание заказа...' : 'Оформить заказ и получить счет'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 