'use client';

import Link from 'next/link';
import { useCart } from '../../components/CartProvider';
import { useState } from 'react';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    // Имитация оформления заказа
    setTimeout(() => {
      setIsLoading(false);
      alert('Заказ оформлен! Спасибо за покупку.');
      clearCart();
    }, 2000);
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 neon-text">Корзина</h1>
          
          <div className="bg-white/10 rounded-xl p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-4">Корзина пуста</h2>
            <p className="text-lg mb-6">Добавьте товары из каталога, чтобы сделать заказ</p>
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
          {/* Список товаров */}
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-300">Артикул: {item.sku}</p>
                  <p className="text-sm text-gray-300">Цена: {item.price.toLocaleString()} ₽</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center transition"
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
                      {(item.price * item.quantity).toLocaleString()} ₽
                    </div>
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
          
          {/* Итого */}
          <div className="border-t border-white/20 pt-6 mb-6">
            <div className="flex justify-between items-center text-xl">
              <span>Товаров: {totalItems}</span>
              <span className="font-bold">Итого: {totalPrice.toLocaleString()} ₽</span>
            </div>
          </div>
          
          {/* Кнопки */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={clearCart}
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-red-600 font-semibold transition"
            >
              Очистить корзину
            </button>
            
            <Link 
              href="/catalog" 
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-cyan-600 font-semibold text-center transition"
            >
              Продолжить покупки
            </Link>
            
            <button 
              onClick={handleCheckout}
              disabled={isLoading}
              className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition disabled:opacity-50 flex-1"
            >
              {isLoading ? 'Оформление...' : 'Оформить заказ'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 