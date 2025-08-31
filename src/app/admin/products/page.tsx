'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user?.isAdmin) {
      router.push('/');
      return;
    }

    loadProducts();
  }, [isAuthenticated, user, router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', data);
        
        // Safely extract products array
        let productsArray: any[] = [];
        
        if (data && typeof data === 'object') {
          if (Array.isArray(data.data)) {
            productsArray = data.data;
          } else if (Array.isArray(data.products)) {
            productsArray = data.products;
          } else if (Array.isArray(data)) {
            productsArray = data;
          }
        }
        
        // Validate each product
        const validProducts = productsArray.filter(item => {
          return item && 
                 typeof item === 'object' && 
                 item.id && 
                 item.name &&
                 typeof item.id === 'string' &&
                 typeof item.name === 'string';
        });
        
        console.log('Valid products count:', validProducts.length);
        setProducts(validProducts);
        
      } else {
        console.error('API response not ok:', response.status);
        setError('Məhsullar yüklənə bilmədi');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Məhsullar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Məhsullar ({products.length} ədəd)
          </h1>
          <p className="text-gray-600">Məhsulların idarə edilməsi</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 text-xl font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Products Display */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Məhsullar yüklənir...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Məhsul tapılmadı</p>
              <button 
                onClick={loadProducts}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Yenidən yüklə
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Mövcud Məhsullar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-xs">IMG</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          ID: {product.id}
                        </p>
                        {product.category && (
                          <p className="text-xs text-gray-500">
                            Kateqoriya: {product.category}
                          </p>
                        )}
                        {product.price && (
                          <p className="text-xs text-green-600 font-medium">
                            {product.price} ₽
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Məlumatları:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Loading: {loading ? 'Bəli' : 'Xeyr'}</p>
            <p>Products count: {products.length}</p>
            <p>Error: {error || 'Yoxdur'}</p>
            <p>Authenticated: {isAuthenticated ? 'Bəli' : 'Xeyr'}</p>
            <p>Is Admin: {user?.isAdmin ? 'Bəli' : 'Xeyr'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 