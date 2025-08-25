'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '../../../components/CartProvider';
import { useAuth } from '../../../components/AuthProvider';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  artikul?: string;
  catalogNumber?: string;
  images?: string[];
  category?: {
    id: string;
    name: string;
  };
  stock: number;
  isActive: boolean;
}

interface SimilarProduct {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  artikul?: string;
  catalogNumber?: string;
  images?: string[];
  stock: number;
  isActive: boolean;
  categories?: {
    name: string;
  };
}

export default function ProductPage() {
  const { t } = useTranslation();
  const params = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated, isApproved, calculateDiscountedPrice, user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const productId = params.id as string;
        if (!productId) {
          setError('Məhsul ID tapılmadı');
          setLoading(false);
          return;
        }

        // Fetch product first
        const productResponse = await fetch(`/api/products/${productId}`);
        
        if (!productResponse.ok) {
          throw new Error('Məhsul tapılmadı');
        }

        const productData = await productResponse.json();
        if (productData.success && productData.data) {
          setProduct(productData.data);
        } else if (productData.id) {
          setProduct(productData);
        } else {
          throw new Error('Məhsul məlumatları düzgün formatda deyil');
        }

        // Fetch similar products after we have the product data
        try {
          const similarResponse = await fetch(`/api/products/similar/${productId}`);
          if (similarResponse.ok) {
            const similarData = await similarResponse.json();
            if (similarData.success && similarData.products) {
              setSimilarProducts(similarData.products);
            }
          }
        } catch (similarError) {
          console.error('Error fetching similar products:', similarError);
          // Don't fail the entire page if similar products fail
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Məhsul yüklənərkən xəta baş verdi');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  // Wishlist functions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(stored);
      setIsInWishlist(stored.includes(product?.id));
    }
  }, [product?.id]);

  const toggleWishlist = () => {
    if (!product) return;
    
    const updatedWishlist = isInWishlist 
      ? wishlist.filter(id => id !== product.id)
      : [...wishlist, product.id];
    
    setWishlist(updatedWishlist);
    setIsInWishlist(!isInWishlist);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      window.dispatchEvent(new Event('wishlistChanged'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-2xl">Yüklənir...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-2xl text-red-400 mb-4">Xəta</div>
            <div className="text-gray-300 mb-8">{error || 'Məhsul tapılmadı'}</div>
            <Link 
              href="/" 
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition"
            >
              Ana səhifəyə qayıt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-300">
            <li>
              <Link href="/" className="hover:text-cyan-400 transition">
                Ana səhifə
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/catalog" className="hover:text-cyan-400 transition">
                Kataloq
              </Link>
            </li>
            <li>/</li>
            <li className="text-white">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images */}
          <div className="lg:col-span-1 space-y-4">
            <div className="aspect-square bg-[#1e293b] rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', product.images?.[selectedImage]);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', product.images?.[selectedImage]);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
                  <span className="text-white font-bold text-lg">{product.name}</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === index ? 'border-cyan-400' : 'border-gray-600'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Thumbnail image failed to load:', image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.category && (
                <div className="text-gray-300 mb-4">
                  Kateqoriya: {product.category.name}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              {isAuthenticated && isApproved && user && user.discountPercentage > 0 ? (
                <div>
                  <div className="text-gray-400 line-through text-xl">
                    {product.price?.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-cyan-400 font-bold text-3xl">
                    {calculateDiscountedPrice(product.price, product.salePrice)?.toFixed(2)} ₽
                  </div>
                  <div className="text-red-400 text-sm">
                    -{user.discountPercentage}% endirim
                  </div>
                </div>
              ) : (
                <div className="text-cyan-400 font-bold text-3xl">
                  {product.price?.toLocaleString('ru-RU')} ₽
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-3 text-gray-300">
              {product.artikul && (
                <div>
                  <span className="font-semibold">Artikul:</span> {product.artikul}
                </div>
              )}
              {product.catalogNumber && (
                <div>
                  <span className="font-semibold">Kataloq №:</span> {product.catalogNumber}
                </div>
              )}
              <div>
                <span className="font-semibold">Stok:</span> {product.stock} ədəd
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Təsvir</h3>
                <p className="text-gray-300 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Add to Cart and Wishlist */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-semibold">Miqdar:</label>
                <div className="flex items-center border border-gray-600 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-2 hover:bg-gray-600 transition"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-600 transition"
                    disabled={quantity >= (product.stock || 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.isActive || product.stock === 0}
                  className={`flex-1 py-4 rounded-lg font-semibold text-lg transition ${
                    product.isActive && product.stock > 0
                      ? 'bg-cyan-500 hover:bg-cyan-600'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  {product.isActive && product.stock > 0 
                    ? 'Səbətə əlavə et' 
                    : product.stock === 0 
                      ? 'Stokda yoxdur' 
                      : 'Məhsul deaktivdir'
                  }
                </button>
                
                <button
                  onClick={toggleWishlist}
                  className={`px-4 py-4 rounded-lg font-semibold text-lg transition ${
                    isInWishlist 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={isInWishlist ? 'Wishlist-dən çıxar' : 'Wishlist-ə əlavə et'}
                >
                  {isInWishlist ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          </div>

          {/* Similar Products - Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-cyan-400">Oxşar Məhsullar</h3>
              {similarProducts.length > 0 ? (
                <div className="space-y-4">
                  {similarProducts.slice(0, 5).map((similarProduct) => (
                    <Link
                      key={similarProduct.id}
                      href={`/product/${similarProduct.id}`}
                      className="block bg-[#0f172a] rounded-lg p-4 hover:bg-[#1e293b] transition-all duration-300 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {similarProduct.images && similarProduct.images.length > 0 ? (
                            <img
                              src={similarProduct.images[0]}
                              alt={similarProduct.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-xs text-center">
                              {similarProduct.name}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-cyan-400 transition">
                            {similarProduct.name}
                          </h4>
                          <div className="text-cyan-400 font-bold text-sm mt-1">
                            {isAuthenticated && isApproved && user && user.discountPercentage > 0
                              ? `${calculateDiscountedPrice(similarProduct.price, similarProduct.salePrice)?.toFixed(2)} ₽`
                              : `${similarProduct.price?.toLocaleString('ru-RU')} ₽`
                            }
                          </div>
                          {similarProduct.stock > 0 ? (
                            <div className="text-green-400 text-xs mt-1">
                              Stok: {similarProduct.stock} ədəd
                            </div>
                          ) : (
                            <div className="text-red-400 text-xs mt-1">
                              Stokda yoxdur
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {similarProducts.length > 5 && (
                    <div className="text-center pt-2">
                      <Link
                        href="/catalog"
                        className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
                      >
                        Bütün oxşar məhsulları gör →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm">Oxşar məhsul tapılmadı</p>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
} 