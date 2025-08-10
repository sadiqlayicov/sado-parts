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
  categories: {
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

  useEffect(() => {
    async function fetchProduct() {
      try {
        const productId = params.id as string;
        if (!productId) {
          setError('Məhsul ID tapılmadı');
          setLoading(false);
          return;
        }

        // Fetch product and similar products in parallel
        const [productResponse, similarResponse] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch(`/api/products/similar/${productId}`)
        ]);

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

        // Handle similar products
        if (similarResponse.ok) {
          const similarData = await similarResponse.json();
          if (similarData.success && similarData.products) {
            setSimilarProducts(similarData.products);
          }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-[#1e293b] rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
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
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
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
                    {product.price?.toLocaleString()}₼
                  </div>
                  <div className="text-cyan-400 font-bold text-3xl">
                    {calculateDiscountedPrice(product.price, product.salePrice)?.toFixed(2)}₼
                  </div>
                </div>
              ) : (
                <div className="text-cyan-400 font-bold text-3xl">
                  {product.price?.toLocaleString()}₼
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

            {/* Add to Cart */}
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

              <button
                onClick={handleAddToCart}
                disabled={!product.isActive || product.stock === 0}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition ${
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
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Oxşar Məhsullar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct) => (
                <Link
                  key={similarProduct.id}
                  href={`/product/${similarProduct.id}`}
                  className="bg-[#1e293b] rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300 group"
                >
                  <div className="aspect-square bg-gradient-to-br from-cyan-500 to-blue-600 relative overflow-hidden">
                    {similarProduct.images && similarProduct.images.length > 0 ? (
                      <img
                        src={similarProduct.images[0]}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm text-center px-2">
                          {similarProduct.name}
                        </span>
                      </div>
                    )}
                    {!similarProduct.isActive && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold">Deaktiv</span>
                      </div>
                    )}
                    {similarProduct.stock === 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Stokda yoxdur
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition">
                      {similarProduct.name}
                    </h3>
                    
                    {similarProduct.categories && (
                      <p className="text-gray-400 text-sm mb-2">
                        {similarProduct.categories.name}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-cyan-400 font-bold">
                        {isAuthenticated && isApproved && user && user.discountPercentage > 0
                          ? `${calculateDiscountedPrice(similarProduct.price, similarProduct.salePrice)?.toFixed(2)}₼`
                          : `${similarProduct.price?.toLocaleString()}₼`
                        }
                      </div>
                      
                      {similarProduct.artikul && (
                        <div className="text-gray-400 text-xs">
                          {similarProduct.artikul}
                        </div>
                      )}
                    </div>
                    
                    {similarProduct.stock > 0 && (
                      <div className="text-green-400 text-xs mt-1">
                        Stok: {similarProduct.stock} ədəd
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 