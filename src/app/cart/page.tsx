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
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
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
    isLoading: cartLoading
  } = useCart();
  const router = useRouter();

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

  const handleCheckout = async () => {
    if (!user?.id || cartItems.length === 0) {
      alert('Səbət məlumatları tapılmadı');
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
      alert('Səbətdə düzgün məhsul məlumatları yoxdur');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Sifariş yarat
      const requestBody = {
        userId: user.id,
        notes: 'Səbətdən yaradılmış sifariş',
        cartItems: validCartItems // Yalnız düzgün cart items-ləri göndər
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
        setIsLoading(false);
        
        // Səbəti təmizlə
        await clearCart();
        
        // Hesab-faktura səhifəsinə yönləndir
        router.push(`/invoice?orderId=${data.order.id}`);
        
      } else {
        console.error('Order creation failed:', data.error);
        throw new Error(data.error || 'Sifariş yaratma xətası');
      }
      
    } catch (error) {
      console.error('Sifariş xətası:', error);
      setIsLoading(false);
      alert('Sifariş yaratma zamanı xəta baş verdi. Yenidən cəhd edin.');
    }
  };

  if (cartLoading) {
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

  if (cartItems.length === 0) {
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
            {cartItems.map((item) => (
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
                      {item.totalSalePrice.toLocaleString()} ₼
                    </div>
                    {item.salePrice < item.price && (
                      <div className="text-sm text-green-400">
                        {item.totalPrice - item.totalSalePrice} ₼ qənaət
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
            ))}
          </div>
          
          {/* Ümumi */}
          <div className="border-t border-white/20 pt-6 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span>Məhsullar: {cartItemsCount}</span>
                <span>Ümumi: {totalPrice.toLocaleString()} ₼</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between items-center text-green-400">
                  <span>Qənaət:</span>
                  <span>-{savings.toLocaleString()} ₼</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold border-t border-white/20 pt-2">
                <span>Ödəniləcək:</span>
                <span>{totalSalePrice.toLocaleString()} ₼</span>
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