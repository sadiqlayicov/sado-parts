"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../../components/CartProvider";

// Similar Products Component
function SimilarProducts({ products }: { products: any[] }) {
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchSimilarProducts() {
      if (products.length === 0) return;

      try {
        // Get categories from wishlist products
        const categoryIds = products
          .map(p => p.categoryId)
          .filter(Boolean)
          .slice(0, 3); // Limit to 3 categories

        if (categoryIds.length === 0) return;

        // Fetch similar products from the same categories
        const response = await fetch(`/api/products?categoryId=${categoryIds[0]}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          const similar = data.success ? data.data : data;
          
          // Filter out products that are already in wishlist
          const filtered = similar.filter((p: any) => 
            !products.some(wp => wp.id === p.id)
          );
          
          setSimilarProducts(filtered.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching similar products:', error);
      }
    }

    fetchSimilarProducts();
  }, [products]);

  if (similarProducts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        Похожие товары не найдены
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {similarProducts.map((product: any) => (
        <div key={product.id} className="bg-[#232b3b] rounded-lg p-3 flex items-center gap-3">
          <Link href={`/product/${product.id}`} className="flex-1">
            <img 
              src={product.images?.[0] || '/placeholder.png'} 
              alt={product.name} 
              className="w-16 h-16 object-cover rounded" 
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/product/${product.id}`}>
              <div className="font-semibold text-sm mb-1 truncate">{product.name}</div>
            </Link>
            <div className="text-xs text-gray-400 mb-1">
              {product.artikul || 'N/A'}
            </div>
            <div className="flex items-center gap-1">
              {product.salePrice && product.salePrice < product.price ? (
                <>
                  <span className="text-red-400 line-through text-xs">
                    {product.price?.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-cyan-400 font-bold text-sm">
                    {product.salePrice?.toLocaleString('ru-RU')} ₽
                  </span>
                </>
              ) : (
                <span className="text-cyan-400 font-bold text-sm">
                  {product.price?.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => addToCart(product.id, 1)}
            className="px-2 py-1 bg-cyan-500 hover:bg-cyan-600 rounded text-white text-xs font-semibold transition"
          >
            +
          </button>
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    function updateWishlist() {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(stored);
      }
    }
    
    updateWishlist();
    window.addEventListener('storage', updateWishlist);
    window.addEventListener('wishlistChanged', updateWishlist);
    
    return () => {
      window.removeEventListener('storage', updateWishlist);
      window.removeEventListener('wishlistChanged', updateWishlist);
    };
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const validIds = wishlist.filter(Boolean);
      console.log('Wishlist page - wishlist IDs:', wishlist);
      console.log('Wishlist page - valid IDs:', validIds);
      
      if (validIds.length === 0) {
        console.log('Wishlist page - no valid IDs, setting products to empty');
        setProducts([]);
        return;
      }
      
      console.log('Wishlist page - fetching products for IDs:', validIds);
      const res = await fetch(`/api/products/batch?ids=${validIds.join(',')}`);
      console.log('Wishlist page - API response status:', res.status);
      
              if (res.ok) {
          const data = await res.json();
          console.log('Wishlist page - API response data:', data);
          setProducts(data);
          
          // Don't clear wishlist if products are not found - they might exist but not be active
          // Only clear if there's an actual error
        } else {
          console.log('Wishlist page - API error, setting products to empty');
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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Избранное</h1>
        {products.length === 0 ? (
          <div className="text-center text-gray-400">Избранное пусто</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Wishlist */}
            <div className="lg:col-span-2">
              <div className="bg-[#1e293b] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Мои избранные товары ({products.length})</h2>
                <div className="space-y-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="bg-[#232b3b] rounded-lg p-4 flex items-center gap-4 relative group">
                      <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" />
                      <img 
                        src={product.images?.[0] || '/placeholder.png'} 
                        alt={product.name} 
                        className="w-20 h-20 object-cover rounded z-20" 
                      />
                      <div className="flex-1 z-20">
                        <div className="font-semibold text-lg mb-1">{product.name}</div>
                        <div className="text-sm text-gray-400 mb-1">
                          Артикул: {product.artikul || 'N/A'} | Каталог: {product.catalogNumber || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          {product.salePrice && product.salePrice < product.price ? (
                            <>
                              <span className="text-red-400 line-through text-sm">
                                {product.price?.toLocaleString('ru-RU')} ₽
                              </span>
                              <span className="text-cyan-400 font-bold text-lg">
                                {product.salePrice?.toLocaleString('ru-RU')} ₽
                              </span>
                              <span className="text-red-400 text-sm">
                                -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                              </span>
                            </>
                          ) : (
                            <span className="text-cyan-400 font-bold text-lg">
                              {product.price?.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 z-20">
                        <button
                          onClick={e => { e.stopPropagation(); e.preventDefault(); addToCart(product.id, 1); }}
                          className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-white text-xs font-semibold transition"
                        >
                          В корзину
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); e.preventDefault(); handleRemove(product.id); }}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded text-white text-xs font-semibold transition"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Similar Products Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[#1e293b] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Похожие товары</h2>
                <SimilarProducts products={products} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 