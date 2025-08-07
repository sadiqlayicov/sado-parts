'use client';
import { useEffect, useState } from 'react';
import { useCart } from '../components/CartProvider';
import { useAuth } from '../components/AuthProvider';
import Link from 'next/link';
import Image from "next/image";
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { isAuthenticated, isApproved, calculateDiscountedPrice, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [showAllLatestProducts, setShowAllLatestProducts] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching products...');
        const productsRes = await fetch('/api/products');
        console.log('Products response status:', productsRes.status);
        
        const productsData = await productsRes.json();
        console.log('Products data:', productsData);
        
        // Check if response has success and data properties (new API format)
        if (productsData.success && Array.isArray(productsData.data)) {
          setProducts(productsData.data);
          console.log(`Loaded ${productsData.data.length} products`);
          // Debug: Check first few products for salePrice values
          if (productsData.data.length > 0) {
            console.log('First 3 products salePrice values:', productsData.data.slice(0, 3).map((p: any) => ({
              name: p.name,
              price: p.price,
              salePrice: p.salePrice
            })));
          }
        } else if (Array.isArray(productsData)) {
          // Fallback for old API format
          setProducts(productsData);
          console.log(`Loaded ${productsData.length} products`);
          // Debug: Check first few products for salePrice values
          if (productsData.length > 0) {
            console.log('First 3 products salePrice values:', productsData.slice(0, 3).map((p: any) => ({
              name: p.name,
              price: p.price,
              salePrice: p.salePrice
            })));
          }
        } else {
          console.error('Products data is not in expected format:', productsData);
          setProducts([]);
        }
        
        const categoriesRes = await fetch('/api/categories');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          // Check if response has success and data properties (new API format)
          if (categoriesData.success && Array.isArray(categoriesData.data)) {
            setCategories(categoriesData.data);
          } else if (Array.isArray(categoriesData)) {
            // Fallback for old API format
            setCategories(categoriesData);
          } else {
            setCategories([]);
          }
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setProducts([]);
        setCategories([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Top satılanlar üçün orderItems-ları yığ
  useEffect(() => {
    let isMounted = true;
    
    async function fetchTopSellers() {
      if (!isMounted) return;
      
      try {
        // İstifadəçi daxil olubsa real orders məlumatlarını istifadə et
        if (isAuthenticated && user?.id) {
          const ordersRes = await fetch(`/api/orders?userId=${user.id}`);
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            if (Array.isArray(ordersData) && isMounted) {
              const allOrderItems = ordersData.flatMap((order: any) => order.items || []);
              // Məhsul üzrə satış miqdarını hesabla
              const salesMap: Record<string, { productId: string, quantity: number }> = {};
              for (const item of allOrderItems) {
                if (!item.productId) continue;
                if (!salesMap[item.productId]) {
                  salesMap[item.productId] = { productId: item.productId, quantity: 0 };
                }
                salesMap[item.productId].quantity += item.quantity || 1;
              }
              // Ən çox satılan 10 məhsulun id-lərini tap
              const topProductIds = Object.values(salesMap)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10)
                .map(x => x.productId);
              // Məhsul məlumatlarını uyğunlaşdır
              const topProducts = products.filter(p => topProductIds.includes(p.id));
              // Satış sayını əlavə et
              const topProductsWithSales = topProducts.map(p => ({
                ...p,
                salesCount: salesMap[p.id]?.quantity || 0
              })).sort((a, b) => b.salesCount - a.salesCount);
              
              if (isMounted) {
                setTopSellers(topProductsWithSales);
                return;
              }
            }
          }
        }
        
        // İstifadəçi daxil olmayıbsa və ya orders məlumatı alına bilməzsə featured məhsulları göstər
        const featuredProducts = products
          .filter(p => p.isFeatured)
          .slice(0, 10)
          .map(p => ({
            ...p,
            salesCount: Math.floor(Math.random() * 50) + 10 // Demo data
          }))
          .sort((a, b) => b.salesCount - a.salesCount);
        
        if (isMounted) {
          setTopSellers(featuredProducts);
        }
      } catch (error) {
        console.error('Error fetching top sellers:', error);
        // Xəta baş verərsə featured məhsulları göstər
        const featuredProducts = products
          .filter(p => p.isFeatured)
          .slice(0, 10)
          .map(p => ({
            ...p,
            salesCount: Math.floor(Math.random() * 50) + 10
          }))
          .sort((a, b) => b.salesCount - a.salesCount);
        
        if (isMounted) {
          setTopSellers(featuredProducts);
        }
      }
    }
    
    if (products.length > 0) {
      fetchTopSellers();
    }
    
    return () => {
      isMounted = false;
    };
  }, [products, isAuthenticated, user?.id]);

  useEffect(() => {
    function updateWishlist() {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(stored);
      }
    }
    window.addEventListener('storage', updateWishlist);
    window.addEventListener('wishlistChanged', updateWishlist);
    updateWishlist(); // İlk renderdə bir dəfə çağır
    return () => {
      window.removeEventListener('storage', updateWishlist);
      window.removeEventListener('wishlistChanged', updateWishlist);
    };
  }, []);

  const handleWishlist = (id: string) => {
    setWishlist((prev: string[]) => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter(i => i !== id);
      } else {
        updated = [...prev, id];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(updated));
        window.dispatchEvent(new Event('wishlistChanged'));
      }
      return updated;
    });
  };

  // Hot Products - son 10 məhsul
  const hotProducts = products.slice(0, 10);

  // Hot Categories - ən çox məhsulu olan kateqoriyalar
  const mostPopularCategories = categories
    .map(cat => ({
      ...cat,
      productCount: products.filter(p => p.categoryId === cat.id).length
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5);

  function ProductCard({ product, onAddToCart, onToggleWishlist, isWishlisted }: any) {
    // Debug: Log product price info
    console.log('ProductCard render:', {
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      isAuthenticated,
      isApproved,
      userDiscount: user?.discountPercentage
    });
    
    return (
      <div className="bg-[#1e293b] rounded-lg p-3 hover:bg-cyan-900 transition-all duration-300 hover:scale-105 flex flex-col h-96 cursor-pointer group relative">
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />
        <div className="w-full h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md mb-3 flex items-center justify-center overflow-hidden flex-shrink-0">
          {product.images && product.images.length > 0 && product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : null}
          <span className="text-white font-bold text-sm" style={{ display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex' }}>{product.brand || product.name}</span>
        </div>
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="min-h-0 flex-1 flex flex-col">
            <div className="font-semibold text-base mb-3 text-center leading-tight overflow-hidden" style={{ minHeight: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</div>
                                <div className="text-center mb-4">
                      {isAuthenticated && isApproved && user && user.discountPercentage > 0 ? (
                        <div>
                          <div className="text-gray-400 line-through text-sm">{product.price?.toLocaleString()}₼</div>
                          <div className="text-cyan-400 font-bold text-lg">{calculateDiscountedPrice(product.price, product.salePrice)?.toFixed(2)}₼</div>
                        </div>
                      ) : product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? (
                        <div>
                          <div className="text-gray-400 line-through text-sm">{product.price?.toLocaleString()}₼</div>
                          <div className="text-cyan-400 font-bold text-lg">{product.salePrice?.toLocaleString()}₼</div>
                        </div>
                      ) : (
                        <div className="text-cyan-400 font-bold text-lg">{product.price?.toLocaleString()}₼</div>
                      )}
                    </div>
            <div className="text-xs text-gray-400 text-center space-y-1 mb-6">
              <div className="truncate">{product.category?.name || '-'}</div>
              <div className="truncate">Artikul: {product.artikul || product.sku || '-'}</div>
            </div>
          </div>
          <div className="flex gap-2 justify-center mt-auto pt-6 relative z-20">
            <button
              onClick={e => { 
                e.stopPropagation(); 
                e.preventDefault(); 
                // Use product.id directly for database lookup, fallback to name-based mapping
                const productId = product.id || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                onAddToCart(productId, 1); 
              }}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-white text-xs font-semibold text-center transition"
            >
              Add to Cart
            </button>
            <button
              onClick={e => { e.stopPropagation(); e.preventDefault(); onToggleWishlist(product.id); }}
              className={`px-4 py-2 rounded text-white text-xs transition ${isWishlisted ? 'bg-red-500' : 'bg-white/10 hover:bg-red-500'}`}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              ♥
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4 text-center">{t('homepage_title')}</h1>
      <p className="text-lg mb-8 text-center">{t('site_deployed')}</p>
      <div className="w-full max-w-5xl mx-auto">
        {/* Top satılanlar bölməsi */}
        <h2 className="text-2xl font-bold mb-4 text-center">{t('top_sellers')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {topSellers.length === 0 ? (
            <div className="col-span-full text-center">No top products available</div>
          ) : (
            topSellers.map((product: any) => (
              <div key={product.id} className="bg-[#1e293b] rounded-lg p-3 hover:bg-cyan-900 transition-all duration-300 hover:scale-105 flex flex-col h-96 cursor-pointer group relative">
                <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />
                <div className="w-full h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md mb-3 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : null}
                  <span className="text-white font-bold text-sm" style={{ display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex' }}>{product.brand || product.name}</span>
                </div>
                <div className="flex-1 flex flex-col justify-between min-h-0">
                  <div className="min-h-0 flex-1 flex flex-col">
                    <div className="font-semibold text-base mb-3 text-center leading-tight overflow-hidden" style={{ minHeight: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</div>
                    <div className="text-center mb-4">
                      {isAuthenticated && isApproved && user && user.discountPercentage > 0 ? (
                        <div>
                          <div className="text-gray-400 line-through text-sm">{product.price?.toLocaleString()}₼</div>
                          <div className="text-cyan-400 font-bold text-lg">{calculateDiscountedPrice(product.price, product.salePrice)?.toFixed(2)}₼</div>
                        </div>
                      ) : product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? (
                        <div>
                          <div className="text-gray-400 line-through text-sm">{product.price?.toLocaleString()}₼</div>
                          <div className="text-cyan-400 font-bold text-lg">{product.salePrice?.toLocaleString()}₼</div>
                        </div>
                      ) : (
                        <div className="text-cyan-400 font-bold text-lg">{product.price?.toLocaleString()}₼</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 text-center mt-auto mb-6">{t('sales_count')}: {product.salesCount}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Ən son əlavə olunan məhsullar */}
        <h2 className="text-2xl font-bold mb-4 text-center">{t('latest_products')}</h2>
        {loading ? (
          <div className="text-center text-lg">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-lg text-gray-400 mb-4">No products available</div>
            <div className="text-sm text-gray-500 mb-4">
              This might be due to:
              <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                <li>Database connection issues</li>
                <li>No products in the database</li>
                <li>Products are not active</li>
                <li>API endpoint errors</li>
              </ul>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-white"
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {(showAllLatestProducts ? products : products.slice(0, 20)).map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onToggleWishlist={handleWishlist}
                  isWishlisted={wishlist.includes(product.id)}
                />
              ))}
            </div>
            {products.length > 20 && (
              <div className="text-center mb-8">
                <button
                  onClick={() => setShowAllLatestProducts(!showAllLatestProducts)}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold transition-colors duration-200"
                >
                  {showAllLatestProducts ? 'Show Less' : 'View All'}
                </button>
              </div>
            )}
          </>
        )}
        {/* Hot Products */}
        <h2 className="text-2xl font-bold mb-4 text-center">{t('hot_products')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {hotProducts.length === 0 ? (
            <div className="col-span-full text-center">No hot products available</div>
          ) : (
            hotProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onToggleWishlist={handleWishlist}
                isWishlisted={wishlist.includes(product.id)}
              />
            ))
          )}
        </div>
        {/* Hot Categories */}
        <h2 className="text-2xl font-bold mb-4 text-center">{t('hot_categories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                      {mostPopularCategories.length === 0 ? <div className="col-span-full text-center">No hot categories available</div> : mostPopularCategories.map((cat: any) => (
            <div key={cat.id} className="bg-[#1e293b] rounded-lg p-3 flex flex-col items-center justify-center h-32">
              <div className="font-semibold text-sm mb-2 text-center">{cat.name}</div>
              {cat.image && <img src={cat.image} alt={cat.name} className="w-16 h-16 object-cover rounded-full" />}
              <div className="text-xs text-gray-400 text-center mt-1">{t('product_count')}: {cat.productCount}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
    

  );
}
