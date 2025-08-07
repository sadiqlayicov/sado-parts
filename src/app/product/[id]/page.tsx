'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../../components/CartProvider';
import { useAuth } from '../../../components/AuthProvider';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isApproved, isAdmin, calculateDiscountedPrice, getDiscountPercentage } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        // Check if response has success and data properties (new API format)
        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          // Fallback for old API format
          setProduct(data);
        }
        setLoading(false);
      });
  }, [id]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const getMainImage = () => {
    if (product?.images && product.images.length > 0) {
      return product.images[selectedImageIndex] || product.images[0];
    }
    return null;
  };

  if (loading) return <div>Загрузка...</div>;
  if (!product || product.error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Товар не найден</h1>
          <p className="text-xl mb-8">Запрашиваемый товар не существует или был удален.</p>
          <Link href="/catalog" className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-bold text-lg transition">
            Вернуться в каталог
          </Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
  };

  const discountedPrice = isApproved && !isAdmin ? calculateDiscountedPrice(product.price, product.salePrice) : (product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? product.salePrice : product.price);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link href="/" className="text-cyan-400 hover:text-cyan-300">Главная</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link href="/catalog" className="text-cyan-400 hover:text-cyan-300">Каталог</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-white">{product.name}</li>
          </ol>
        </nav>

        {/* Discount Banner for Approved Users */}
        {isApproved && !isAdmin && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2">🎉 Скидка {getDiscountPercentage()}% для одобренных пользователей!</h2>
            <p>Цена указана с учетом скидки</p>
          </div>
        )}

        {/* Approval Pending Banner */}
        {!isApproved && !isAdmin && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2">⏳ Ваш аккаунт ожидает одобрения</h2>
            <p>После одобрения администратором вы получите доступ к специальным ценам</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Изображение товара */}
          <div className="space-y-6">
            <div className="w-full h-96 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center overflow-hidden">
              {getMainImage() ? (
                <img
                  src={getMainImage()}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'auto' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <span className="text-white font-bold text-4xl" style={{ display: getMainImage() ? 'none' : 'flex' }}>
                {product.brand || product.name}
              </span>
            </div>
            
            {/* Дополнительные изображения */}
            <div className="grid grid-cols-4 gap-4">
              {product.images && product.images.length > 0
                ? product.images.map((img: string, idx: number) => (
                    <div 
                      key={idx} 
                      className={`w-full h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 ${
                        selectedImageIndex === idx ? 'ring-2 ring-cyan-500 scale-105' : 'hover:scale-105'
                      }`}
                      onClick={() => handleImageClick(idx)}
                    >
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        style={{ imageRendering: 'auto' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                      <span className="text-white font-bold text-sm" style={{ display: 'none' }}>
                        {product.brand || product.name}
                      </span>
                    </div>
                  ))
                : [1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{product.brand || product.name}</span>
                    </div>
                  ))}
            </div>
          </div>

          {/* Информация о товаре */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-300 text-lg mb-4">{product.description || '-'}</p>
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-cyan-500 text-white rounded-full text-sm font-semibold">
                  {product.brand}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  product.stock > 10 ? 'bg-green-500 text-white' : 
                  product.stock > 0 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {product.stock > 0 ? `${product.stock} шт в наличии` : 'Нет в наличии'}
                </span>
              </div>
            </div>

            {/* Цена */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {isApproved && !isAdmin ? (
                  <>
                    <span className="text-3xl text-gray-400 line-through">{product.price.toLocaleString()} ₽</span>
                    <span className="text-4xl font-bold text-green-400">{discountedPrice.toLocaleString()} ₽</span>
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                      -{getDiscountPercentage()}%
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-cyan-400">{product.price.toLocaleString()} ₽</span>
                )}
              </div>
              
              {!isApproved && !isAdmin && (
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⏳ После одобрения администратором вы получите скидку на этот товар!
                  </p>
                </div>
              )}
            </div>

            {/* Количество и кнопки */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold">Количество:</label>
                <div className="flex items-center border border-cyan-500/20 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-cyan-400 hover:text-white transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= product.stock) {
                        setQuantity(value);
                      }
                    }}
                    className="px-4 py-2 text-white bg-transparent border-none outline-none text-center w-16 hide-number-spin"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 text-cyan-400 hover:text-white transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 rounded-xl text-white font-semibold transition"
                >
                  <FaShoppingCart />
                  Добавить в корзину
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="px-6 py-3 bg-white/10 hover:bg-cyan-600 rounded-xl text-white transition"
                >
                  {isFavorite ? <FaHeart className="text-red-400" /> : <FaRegHeart />}
                </button>
              </div>
            </div>

            {/* Характеристики */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Характеристики</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Артикул:</span>
                  <p className="font-semibold">{product.artikul || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Каталожный номер:</span>
                  <p className="font-semibold">{product.catalogNumber || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Бренд:</span>
                  <p className="font-semibold">{product.brand || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Категория:</span>
                  <p className="font-semibold">{product.category?.name || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Подробное описание */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Подробное описание</h2>
          <div className="bg-[#1e293b] rounded-xl p-8">
            <p className="text-gray-300 leading-relaxed">{product.description || 'Təsvir mövcud deyil'}</p>
          </div>
        </div>

        {/* Похожие товары */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Похожие товары</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* This part of the code was not provided in the edit_specification,
                so it will remain as is, using a placeholder for products.
                In a real scenario, you would fetch related products here. */}
            {/* For now, we'll just show a placeholder or remove if not needed */}
            {/* <div className="bg-[#1e293b] rounded-xl p-4 hover:scale-105 transition shadow-lg">
              <div className="w-full h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Placeholder</span>
              </div>
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">Placeholder Product</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 line-through">0 ₽</span>
                <span className="text-lg font-bold text-green-400">0 ₽</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Hide number input spin buttons for all browsers */}
      <style jsx global>{`
        input.hide-number-spin::-webkit-outer-spin-button,
        input.hide-number-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.hide-number-spin[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </main>
  );
} 