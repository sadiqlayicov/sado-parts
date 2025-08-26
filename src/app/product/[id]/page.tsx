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
      <div className="min-h-screen bg-white text-gray-800 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-2xl">Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white text-gray-800 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-2xl text-red-600 mb-4">Ошибка</div>
            <div className="text-gray-600 mb-8">{error || 'Товар не найден'}</div>
            <Link 
              href="/" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-blue-600 transition">
                Главная
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/catalog" className="hover:text-blue-600 transition">
                Каталог
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images */}
          <div className="lg:col-span-1 space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
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
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
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
                      selectedImage === index ? 'border-blue-500' : 'border-gray-300'
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
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{product.name}</h1>
              {product.category && (
                <div className="text-gray-600 mb-4">
                  Категория: {product.category.name}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              {isAuthenticated && isApproved && user && user.discountPercentage > 0 ? (
                <div>
                  <div className="text-gray-500 line-through text-xl">
                    {product.price?.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-blue-600 font-bold text-3xl">
                    {calculateDiscountedPrice(product.price, product.salePrice)?.toFixed(2)} ₽
                  </div>
                  <div className="text-red-500 text-sm">
                    -{user.discountPercentage}% скидка
                  </div>
                </div>
              ) : (
                <div className="text-blue-600 font-bold text-3xl">
                  {product.price?.toLocaleString('ru-RU')} ₽
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-3 text-gray-700 bg-gray-50 p-4 rounded-lg">
              {product.artikul && (
                <div>
                  <span className="font-semibold">Артикул:</span> {product.artikul}
                </div>
              )}
              {product.catalogNumber && (
                <div>
                  <span className="font-semibold">Каталог №:</span> {product.catalogNumber}
                </div>
              )}
              <div>
                <span className="font-semibold">Остаток:</span> {product.stock} шт.
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Описание</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Add to Cart and Wishlist */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-semibold text-gray-900">Количество:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-2 hover:bg-gray-100 transition"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100 transition"
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
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 cursor-not-allowed text-gray-500'
                  }`}
                >
                  {product.isActive && product.stock > 0 
                    ? 'Добавить в корзину' 
                    : product.stock === 0 
                      ? 'Нет в наличии' 
                      : 'Товар недоступен'
                  }
                </button>
                
                <button
                  onClick={toggleWishlist}
                  className={`px-4 py-4 rounded-lg font-semibold text-lg transition ${
                    isInWishlist 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={isInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  {isInWishlist ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          </div>

          {/* Similar Products - Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Похожие товары</h3>
              {similarProducts.length > 0 ? (
                <div className="space-y-4">
                  {similarProducts.slice(0, 5).map((similarProduct) => (
                    <Link
                      key={similarProduct.id}
                      href={`/product/${similarProduct.id}`}
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-300 group border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {similarProduct.images && similarProduct.images.length > 0 ? (
                            <img
                              src={similarProduct.images[0]}
                              alt={similarProduct.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 text-xs text-center">
                              {similarProduct.name}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition">
                            {similarProduct.name}
                          </h4>
                          <div className="text-blue-600 font-bold text-sm mt-1">
                            {isAuthenticated && isApproved && user && user.discountPercentage > 0
                              ? `${calculateDiscountedPrice(similarProduct.price, similarProduct.salePrice)?.toFixed(2)} ₽`
                              : `${similarProduct.price?.toLocaleString('ru-RU')} ₽`
                            }
                          </div>
                          {similarProduct.stock > 0 ? (
                            <div className="text-green-600 text-xs mt-1">
                              В наличии: {similarProduct.stock} шт.
                            </div>
                          ) : (
                            <div className="text-red-600 text-xs mt-1">
                              Нет в наличии
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
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition"
                      >
                        Посмотреть все похожие товары →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm">Похожие товары не найдены</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 