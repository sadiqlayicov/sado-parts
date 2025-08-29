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
  artikul?: string;
  catalogNumber?: string;
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
    if (quantity < 1) return;
    await updateQuantity(cartItemId, quantity);
  };

  const handleRemoveItem = async (cartItemId: string) => {
    await removeFromCart(cartItemId);
  };

  const handleClearCart = async () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
      await clearCart();
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Корзина пуста');
      return;
    }

    if (!user?.id) {
      alert('Пользователь не найден. Пожалуйста, войдите в систему.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          orderNumber: orderNumber,
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku || '',
            categoryName: item.categoryName || '',
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice
          })),
          totalAmount: totalSalePrice,
          notes: `Заказ создан пользователем ${user.email}`
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await clearCart();
          router.push(`/payment?orderId=${result.order.id}`);
        } else {
          alert('Ошибка при создании заказа: ' + (result.error || result.message));
        }
      } else {
        const errorData = await response.json();
        alert('Ошибка при создании заказа: ' + (errorData.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Ошибка при оформлении заказа');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white text-gray-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Требуется авторизация</h1>
            <p className="text-gray-600 mb-6">Для просмотра корзины необходимо войти в систему</p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Войти в систему
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white text-gray-800 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка корзины...</p>
          </div>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-white text-gray-800 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Корзина</h1>
          
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
            <div className="text-gray-400 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Корзина пуста</h2>
            <p className="text-gray-600 mb-8">Добавьте товары в корзину для оформления заказа</p>
            <Link
              href="/catalog"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Перейти в каталог
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Корзина</h1>
        
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border border-gray-200">
          {/* Məhsullar siyahısı */}
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => {
              const translatedItem = translateProductData(item);
              return (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold break-words text-gray-900">{translatedItem.name}</h3>
                    <p className="text-xs md:text-sm text-gray-600">Артикул: {translatedItem.artikul || translatedItem.sku}</p>
                    {translatedItem.catalogNumber && (
                      <p className="text-xs md:text-sm text-gray-600">Каталожный №: {translatedItem.catalogNumber}</p>
                    )}
                    <p className="text-xs md:text-sm text-gray-600">
                      Цена: {isApproved && user && user.discountPercentage > 0 ? (
                        <span>
                          <span className="line-through text-gray-400">{translatedItem.price.toLocaleString()}</span>
                          <span className="text-green-600 ml-2 font-semibold">{calculateDiscountedPrice(translatedItem.price, null).toLocaleString()}</span>
                        </span>
                      ) : (
                        <span className="font-semibold">{translatedItem.price.toLocaleString()}</span>
                      )} ₽
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">Категория: {translatedItem.categoryName}</p>
                  </div>
                
                  <div className="flex items-center gap-3">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-gray-900 font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Total price for this item */}
                    <div className="text-right min-w-[80px]">
                      <div className="text-lg font-semibold text-gray-900">
                        {isApproved && user && user.discountPercentage > 0 ? (
                          <span>
                            <span className="line-through text-gray-400 text-sm">{translatedItem.totalPrice.toLocaleString()}</span>
                            <br />
                            <span className="text-green-600">{calculateDiscountedPrice(translatedItem.totalPrice, null).toLocaleString()}</span>
                          </span>
                        ) : (
                          translatedItem.totalPrice.toLocaleString()
                        )} ₽
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition p-1"
                      title="Удалить из корзины"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Order summary */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-700">Товары: {cartItemsCount}</span>
              <span className="text-gray-700">Итого: {totalPrice.toLocaleString()} ₽</span>
            </div>
            {isApproved && user && user.discountPercentage > 0 && (
              <div className="flex justify-between items-center text-sm text-green-600 mt-2">
                <span>Скидка ({user.discountPercentage}%):</span>
                <span>-{savings.toLocaleString()} ₽</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold text-gray-900 mt-2 pt-2 border-t border-gray-200">
              <span>К оплате:</span>
              <span>{totalSalePrice.toLocaleString()} ₽</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/catalog"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center text-sm"
            >
              Продолжить покупки
            </Link>
            <Link
              href="/profile"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center text-sm"
            >
              Мой профиль
            </Link>
            <button
              onClick={handleClearCart}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition text-sm"
            >
              Очистить корзину
            </button>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition text-sm"
            >
              {checkoutLoading ? 'Обработка...' : 'Оформить заказ и получить счет'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 