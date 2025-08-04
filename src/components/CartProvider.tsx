'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  salePrice: number;
  quantity: number;
  sku: string;
  stock: number;
  images: string[];
  categoryName: string;
  totalPrice: number;
  totalSalePrice: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartItemsCount: number;
  totalPrice: number;
  totalSalePrice: number;
  savings: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Cart items count
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Total prices
  const totalPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalSalePrice = cartItems.reduce((sum, item) => sum + item.totalSalePrice, 0);
  const savings = totalPrice - totalSalePrice;

  // Load cart from API when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshCart();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated, user?.id]);

  const refreshCart = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setCartItems(data.cart.items || []);
      }
    } catch (error) {
      console.error('Cart refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user?.id) {
      alert('Səbətə əlavə etmək üçün daxil olmalısınız');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId, quantity })
      });

      const data = await response.json();
      
      if (data.success) {
        await refreshCart(); // Refresh cart after adding
      } else {
        alert(data.error || 'Məhsul əlavə edilə bilmədi');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Məhsul əlavə edilə bilmədi');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart?cartItemId=${cartItemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await refreshCart(); // Refresh cart after removing
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity })
      });

      if (response.ok) {
        await refreshCart(); // Refresh cart after updating
      }
    } catch (error) {
      console.error('Update quantity error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Remove all items one by one
      for (const item of cartItems) {
        await fetch(`/api/cart?cartItemId=${item.id}`, {
          method: 'DELETE'
        });
      }
      setCartItems([]);
    } catch (error) {
      console.error('Clear cart error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartItemsCount,
      totalPrice,
      totalSalePrice,
      savings,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      refreshCart,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 