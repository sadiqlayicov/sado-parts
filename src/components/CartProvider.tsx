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
  const { user, isAuthenticated, isApproved } = useAuth();
  const hasLoadedCart = useRef(false);
  
  // Debouncing for add to cart
  const addToCartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAddToCart = useRef<Set<string>>(new Set());
  
  // Debouncing for quantity updates
  const quantityUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingQuantityUpdates = useRef<Map<string, number>>(new Map());

  // Ensure cartItems is always an array
  const safeCartItems = cartItems || [];
  
  // Cart items count
  const cartItemsCount = safeCartItems.reduce((sum, item) => sum + parseInt(item.quantity.toString()), 0);
  
  // Total prices - ensure proper number conversion
  const totalPrice = safeCartItems.reduce((sum, item) => {
    const itemTotal = typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);
  
  // Endirim yalnız təsdiqlənmiş istifadəçilər üçün
  const { calculateDiscountedPrice } = useAuth();
  
  const totalSalePrice = safeCartItems.reduce((sum, item) => {
    const itemTotal = typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice;
    const discountedPrice = isApproved && isAuthenticated && user && user.discountPercentage > 0 
      ? calculateDiscountedPrice(itemTotal / item.quantity, null) * item.quantity
      : itemTotal;
    return sum + (isNaN(discountedPrice) ? 0 : discountedPrice);
  }, 0);
  
  const savings = totalPrice - totalSalePrice;

  // Load cart from API when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && !hasLoadedCart.current) {
      const loadCart = async () => {
        if (!user?.id) return;
        
        setIsLoading(true);
        try {
          const response = await fetch(`/api/cart?userId=${user.id}`);
          const data = await response.json();
          
          if (data.success && data.cart && data.cart.items) {
            // Convert string values to numbers for proper calculations
            const processedItems = data.cart.items.map((item: any) => ({
              ...item,
              price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
              salePrice: typeof item.salePrice === 'string' ? parseFloat(item.salePrice) : item.salePrice,
              quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity,
              totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice,
              totalSalePrice: typeof item.totalSalePrice === 'string' ? parseFloat(item.totalSalePrice) : item.totalSalePrice
            }));
            
            setCartItems(processedItems);
            hasLoadedCart.current = true;
          } else {
            setCartItems([]);
          }
        } catch (error) {
          setCartItems([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadCart();
    } else if (!isAuthenticated) {
      setCartItems([]);
      hasLoadedCart.current = false;
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
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user?.id) {
      const shouldGo = typeof window !== 'undefined' ? confirm('Пожалуйста, войдите в систему для добавления товаров в корзину. Перейти к входу?') : false;
      if (shouldGo && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }

    // Check if this product is already being added
    if (pendingAddToCart.current.has(productId)) {
      console.log('Add to cart already in progress for product:', productId);
      return;
    }

    // Add to pending set
    pendingAddToCart.current.add(productId);

    // Clear existing timeout
    if (addToCartTimeoutRef.current) {
      clearTimeout(addToCartTimeoutRef.current);
    }

    // Set new timeout for debouncing
    addToCartTimeoutRef.current = setTimeout(async () => {
      const optimisticId = `temp-${Date.now()}`;
    
    try {
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
       // Remove from pending set
       pendingAddToCart.current.delete(productId);
     }
    }, 300); // 300ms debounce delay
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user?.id) return;

    // Optimistic update - immediately remove from UI
    setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
    
    // Update server in background
    try {
      const response = await fetch(`/api/cart?cartItemId=${cartItemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        // Revert optimistic update on error
        await refreshCart();
      } else {
        console.log('Cart item removed from local state and server:', cartItemId);
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      // Revert optimistic update on error
      await refreshCart();
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user?.id) return;

    // If quantity is 0 or negative, remove the item instead
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    // Store the pending update
    pendingQuantityUpdates.current.set(cartItemId, quantity);

    // Clear existing timeout
    if (quantityUpdateTimeoutRef.current) {
      clearTimeout(quantityUpdateTimeoutRef.current);
    }

    // Set new timeout for debouncing
    quantityUpdateTimeoutRef.current = setTimeout(async () => {
      const finalQuantity = pendingQuantityUpdates.current.get(cartItemId);
      if (finalQuantity === undefined) return;

      // If quantity became 0 or negative during debounce, remove item
      if (finalQuantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }

      // Optimistic update - immediately update UI without loading state
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: finalQuantity, totalPrice: item.price * finalQuantity, totalSalePrice: item.salePrice * finalQuantity }
            : item
        )
      );

      // Update server in background without showing loading state
      try {
        const response = await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: finalQuantity })
        });

        if (!response.ok) {
          // Revert optimistic update on error
          await refreshCart();
        }
      } catch (error) {
        console.error('Update quantity error:', error);
        // Revert optimistic update on error
        await refreshCart();
      } finally {
        // Clear pending update
        pendingQuantityUpdates.current.delete(cartItemId);
      }
    }, 300); // Reduced to 300ms for faster response
  };

  const clearCart = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Clear local state immediately to prevent map errors
      setCartItems([]);
      
      // Remove all items from database
      if (safeCartItems && safeCartItems.length > 0) {
        for (const item of safeCartItems) {
          try {
            await fetch(`/api/cart?cartItemId=${item.id}`, {
              method: 'DELETE'
            });
          } catch (itemError) {
            console.error('Error removing cart item:', itemError);
          }
        }
      }
      console.log('Cart cleared from local state and database');
    } catch (error) {
      console.error('Clear cart error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems: safeCartItems,
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