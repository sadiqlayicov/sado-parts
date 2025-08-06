'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthProvider';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  salePrice: number;
  quantity: number;
  sku: string;
  stock: number;
  images: string[];
  categoryName: string;
  totalPrice: number;
  totalSalePrice: number;
  createdAt: string;
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
  const hasLoadedCart = useRef(false);

  // Cart items count
  const cartItemsCount = cartItems.reduce((sum, item) => sum + parseInt(item.quantity.toString()), 0);
  
  // Total prices - ensure proper number conversion
  const totalPrice = cartItems.reduce((sum, item) => {
    const itemTotal = typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);
  
  const totalSalePrice = cartItems.reduce((sum, item) => {
    const itemTotal = typeof item.totalSalePrice === 'string' ? parseFloat(item.totalSalePrice) : item.totalSalePrice;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);
  
  const savings = totalPrice - totalSalePrice;

  // Load cart from API when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const loadCart = async () => {
        if (!user?.id) return;
        
        setIsLoading(true);
        try {
          const response = await fetch(`/api/cart?userId=${user.id}`);
          const data = await response.json();
          
          if (data.success) {
            // Convert string values to numbers for proper calculations
            const processedItems = (data.cart.items || []).map((item: any) => ({
              ...item,
              price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
              salePrice: typeof item.salePrice === 'string' ? parseFloat(item.salePrice) : item.salePrice,
              quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity,
              totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice,
              totalSalePrice: typeof item.totalSalePrice === 'string' ? parseFloat(item.totalSalePrice) : item.totalSalePrice
            }));
            setCartItems(processedItems);
          }
        } catch (error) {
          console.error('Cart refresh error:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadCart();
    } else if (!isAuthenticated) {
      setCartItems([]);
    }
  }, [isAuthenticated, user?.id]);

  const refreshCart = async () => {
    if (!user?.id || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        // Convert string values to numbers for proper calculations
        const processedItems = (data.cart.items || []).map((item: any) => ({
          ...item,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          salePrice: typeof item.salePrice === 'string' ? parseFloat(item.salePrice) : item.salePrice,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity,
          totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice,
          totalSalePrice: typeof item.totalSalePrice === 'string' ? parseFloat(item.totalSalePrice) : item.totalSalePrice
        }));
        setCartItems(processedItems);
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

    // Prevent multiple simultaneous requests for the same product
    if (isLoading) {
      console.log('Add to cart already in progress, skipping...');
      return;
    }

    setIsLoading(true);
    const optimisticId = `temp-${Date.now()}`;
    
    try {
      console.log('Adding to cart:', { productId, quantity, userId: user.id });
      
      // Optimistic update - immediately update UI
      const optimisticItem = {
        id: optimisticId,
        productId,
        name: 'Yüklənir...',
        description: 'Product description',
        price: 0,
        salePrice: 0,
        quantity,
        sku: '',
        stock: 10,
        images: [],
        categoryName: 'General',
        totalPrice: 0,
        totalSalePrice: 0,
        createdAt: new Date().toISOString()
      };

      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.productId === productId);
        if (existingItemIndex >= 0) {
          // Update existing item optimistically
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
            totalPrice: updatedItems[existingItemIndex].price * (updatedItems[existingItemIndex].quantity + quantity),
            totalSalePrice: updatedItems[existingItemIndex].salePrice * (updatedItems[existingItemIndex].quantity + quantity)
          };
          return updatedItems;
        } else {
          // Add new item optimistically
          return [...prevItems, optimisticItem];
        }
      });

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId, quantity })
      });

      const data = await response.json();
      console.log('Cart API response:', data);
      
      if (response.ok && data.success) {
        // Update with real data from server
        const newItem = data.cartItem;
        if (newItem) {
          setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.productId === productId);
            if (existingItemIndex >= 0) {
              // Update existing item with real data
              const updatedItems = [...prevItems];
              updatedItems[existingItemIndex] = newItem;
              return updatedItems;
            } else {
              // Replace optimistic item with real data
              return prevItems.map(item => 
                item.id === optimisticId ? newItem : item
              );
            }
          });
        }
        console.log('Cart updated successfully');
      } else {
        // Revert optimistic update on error
        setCartItems(prevItems => {
          const existingItemIndex = prevItems.findIndex(item => item.productId === productId);
          if (existingItemIndex >= 0) {
            const updatedItems = [...prevItems];
            const originalItem = updatedItems[existingItemIndex];
            updatedItems[existingItemIndex] = {
              ...originalItem,
              quantity: originalItem.quantity - quantity,
              totalPrice: originalItem.price * (originalItem.quantity - quantity),
              totalSalePrice: originalItem.salePrice * (originalItem.quantity - quantity)
            };
            return updatedItems;
          } else {
            return prevItems.filter(item => item.id !== optimisticId);
          }
        });
        
        console.error('Add to cart failed:', data.error);
        alert(data.error || 'Səbətə əlavə etmə zamanı xəta baş verdi');
      }
    } catch (error) {
      // Revert optimistic update on error
      setCartItems(prevItems => prevItems.filter(item => item.id !== optimisticId));
      console.error('Add to cart error:', error);
      alert('Səbətə əlavə etmə zamanı xəta baş verdi');
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
        // Remove item from local state
        setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
        console.log('Cart item removed from local state:', cartItemId);
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
        // Update item in local state instead of refreshing
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.id === cartItemId 
              ? { ...item, quantity, totalPrice: item.price * quantity, totalSalePrice: item.salePrice * quantity }
              : item
          )
        );
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
      // Clear local state immediately
      setCartItems([]);
      console.log('Cart cleared from local state');
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