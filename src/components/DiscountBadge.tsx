'use client';

import { useAuth } from './AuthProvider';

interface DiscountBadgeProps {
  originalPrice: number;
  productSalePrice?: number | null;
  className?: string;
}

export default function DiscountBadge({ originalPrice, productSalePrice, className = '' }: DiscountBadgeProps) {
  const { isApproved, getDiscountPercentage, calculateDiscountedPrice } = useAuth();
  
  const discountPercentage = getDiscountPercentage();
  const discountedPrice = calculateDiscountedPrice(originalPrice, productSalePrice);
  const savings = originalPrice - discountedPrice;

  if (!isApproved || discountPercentage === 0) {
    return null;
  }

  return (
    <div className={`bg-green-100 border border-green-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-green-800">
            🎉 Sizin endiriminiz: {discountPercentage}%
          </p>
          <p className="text-xs text-green-600">
            Qənaət: {savings.toFixed(2)} ₽
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-800">
            {discountedPrice.toFixed(2)} ₽
          </p>
          <p className="text-xs text-green-600 line-through">
            {originalPrice.toFixed(2)} ₽
          </p>
        </div>
      </div>
    </div>
  );
} 