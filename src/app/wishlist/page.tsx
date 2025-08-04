"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../../components/CartProvider";

export default function WishlistPage() {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(stored);
    }
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const validIds = wishlist.filter(Boolean);
      if (validIds.length === 0) {
        setProducts([]);
        return;
      }
      const res = await fetch(`/api/products/batch?ids=${validIds.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length === 0 && validIds.length > 0) {
          localStorage.setItem('wishlist', '[]');
          setWishlist([]);
        }
      } else {
        setProducts([]);
      }
    }
    fetchProducts();
  }, [wishlist]);

  const handleRemove = (id: string) => {
    const updated = wishlist.filter((wid) => wid !== id);
    setWishlist(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(updated));
      window.dispatchEvent(new Event('wishlistChanged'));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Избранное</h1>
        {products.length === 0 ? (
          <div className="text-center text-gray-400">Избранное пусто</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <div key={product.id} className="bg-[#232b3b] rounded-xl p-6 flex flex-col items-center relative group">
                <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" />
                <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} className="w-24 h-24 object-cover rounded mb-2 z-20" />
                <div className="font-semibold text-lg mb-1 text-center z-20">{product.name}</div>
                <div className="text-cyan-400 font-bold text-md mb-2 z-20">{product.price?.toLocaleString()}₼</div>
                <div className="flex gap-2 mt-2 z-20">
                  <button
                    onClick={e => { e.stopPropagation(); e.preventDefault(); addToCart(product.id, 1); }}
                    className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-white text-xs font-semibold text-center transition"
                  >
                    Добавить в корзину
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); e.preventDefault(); handleRemove(product.id); }}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded text-white text-xs font-semibold text-center transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 