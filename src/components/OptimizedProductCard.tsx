'use client';

import React, { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { useAuth } from './AuthProvider';
import DiscountBadge from './DiscountBadge';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    salePrice: number | null;
    sku: string;
    stock: number;
    images: string[];
    category?: {
      name: string;
    };
  };
  onAddToWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
}

const OptimizedProductCard = memo(({ product, onAddToWishlist, isInWishlist }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isAuthenticated, isApproved, calculateDiscountedPrice } = useAuth();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = useCallback(async () => {
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }, [addToCart, product.id]);

  const handleWishlistToggle = useCallback(() => {
    if (onAddToWishlist) {
      onAddToWishlist(product.id);
    }
  }, [onAddToWishlist, product.id]);

  // Calculate final price with discount
  const finalPrice = isAuthenticated && isApproved && product.salePrice
    ? calculateDiscountedPrice(product.salePrice, null)
    : product.salePrice || product.price;

  const discountPercentage = product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const mainImage = product.images?.[0] || '/placeholder-product.jpg';

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative aspect-square">
        <Link href={`/product/${product.id}`}>
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            priority={false}
            loading="lazy"
          />
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
          {imageError && (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Image not available</span>
            </div>
          )}
        </Link>
        
        {discountPercentage > 0 && (
          <DiscountBadge percentage={discountPercentage} />
        )}
        
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 p-2 rounded-full transition-colors duration-200 ${
            isInWishlist 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-600 hover:bg-red-50'
          }`}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {product.category && (
          <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {product.salePrice && product.salePrice < product.price ? (
              <>
                <span className="text-lg font-bold text-red-600">
                  {finalPrice.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {product.price.toLocaleString('ru-RU')} ₽
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {finalPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            SKU: {product.sku}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {product.stock > 0 ? (
              <span className="text-green-600">В наличии: {product.stock}</span>
            ) : (
              <span className="text-red-600">Нет в наличии</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              product.stock > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.stock > 0 ? 'В корзину' : 'Нет в наличии'}
          </button>
        </div>
      </div>
    </div>
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';

export default OptimizedProductCard;