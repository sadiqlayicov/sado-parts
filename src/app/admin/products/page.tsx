'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheckCircle, FaTrashAlt, FaEye, FaFilter, FaSave, FaTimes } from 'react-icons/fa';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string | null;
  artikul: string;
  catalogNumber: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
}

export default function ProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    artikul: '',
    catalogNumber: '',
    stock: 0,
    isActive: true,
    isFeatured: false
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    artikul: '',
    catalogNumber: '',
    stock: 0,
    isActive: true,
    isFeatured: false
  });

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

  // Auto-hide messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
        
        // Validate and clean each product
        const validProducts = productsArray.filter(item => {
          return item && 
                 typeof item === 'object' && 
                 item.id && 
                 item.name &&
                 typeof item.id === 'string' &&
                 typeof item.name === 'string';
        }).map(product => {
          // Clean the product object to prevent React Error #31
          return {
            id: String(product.id || ''),
            name: String(product.name || ''),
            description: product.description ? String(product.description) : '',
            price: typeof product.price === 'number' ? product.price : 0,
            category: product.category ? String(product.category.name || product.category) : '',
            image: product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
            artikul: product.artikul ? String(product.artikul) : '',
            catalogNumber: product.catalogNumber ? String(product.catalogNumber) : '',
            isActive: Boolean(product.isActive),
            isFeatured: Boolean(product.isFeatured),
            stock: typeof product.stock === 'number' ? product.stock : 0
          };
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

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      setError('Məhsul adı tələb olunur');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        setSuccessMessage('Məhsul uğurla əlavə edildi');
        setShowAddForm(false);
        setNewProduct({
          name: '',
          description: '',
          price: 0,
          category: '',
          artikul: '',
          catalogNumber: '',
          stock: 0,
          isActive: true,
          isFeatured: false
        });
        loadProducts();
      } else {
        const errorData = await response.json();
        setError(`Məhsul əlavə edilə bilmədi: ${errorData.error || 'Naməlum xəta'}`);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Məhsul əlavə edilərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editForm.name.trim()) {
      setError('Məhsul adı tələb olunur');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setSuccessMessage('Məhsul uğurla yeniləndi');
        setEditingProduct(null);
        loadProducts();
      } else {
        const errorData = await response.json();
        setError(`Məhsul yenilənə bilmədi: ${errorData.error || 'Naməlum xəta'}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Məhsul yenilənərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Məhsul uğurla silindi');
        loadProducts();
      } else {
        const errorData = await response.json();
        setError(`Məhsul silinə bilmədi: ${errorData.error || 'Naməlum xəta'}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Məhsul silinərkən xəta baş verdi');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      setError('Silmək üçün məhsullar seçin');
      return;
    }

    if (!confirm(`${selectedProducts.length} məhsulu silmək istədiyinizə əminsiniz?`)) {
      return;
    }

    try {
      const response = await fetch('/api/products/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedProducts }),
      });

      if (response.ok) {
        setSuccessMessage(`${selectedProducts.length} məhsul uğurla silindi`);
        setSelectedProducts([]);
        setSelectAll(false);
        loadProducts();
      } else {
        const errorData = await response.json();
        setError(`Toplu silmə xətası: ${errorData.error || 'Naməlum xəta'}`);
      }
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      setError('Toplu silmə zamanı xəta baş verdi');
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
      setSelectAll(false);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
      setSelectAll(true);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      artikul: product.artikul,
      catalogNumber: product.catalogNumber,
      stock: product.stock,
      isActive: product.isActive,
      isFeatured: product.isFeatured
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.artikul.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.catalogNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

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

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900 text-xl font-bold"
            >
              ×
            </button>
          </div>
        )}

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

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filterlər:</span>
              </div>
              
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Axtarış... (ad, artikul, kataloq №)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Bütün kateqoriyalar' : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              {selectedProducts.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <FaTrashAlt className="mr-2" />
                  Seçilmişləri sil ({selectedProducts.length})
                </button>
              )}
              <button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <FaPlus className="mr-2" />
                Yeni Məhsul
              </button>
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Yeni Məhsul Əlavə Et</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Məhsul Adı *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Məhsul adını daxil edin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qiymət *</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kateqoriya</label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kateqoriya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Artikul</label>
                <input
                  type="text"
                  value={newProduct.artikul}
                  onChange={(e) => setNewProduct({...newProduct, artikul: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Artikul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kataloq №</label>
                <input
                  type="text"
                  value={newProduct.catalogNumber}
                  onChange={(e) => setNewProduct({...newProduct, catalogNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kataloq nömrəsi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stok</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Təsvir</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Məhsul təsviri"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.isActive}
                    onChange={(e) => setNewProduct({...newProduct, isActive: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktiv</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.isFeatured}
                    onChange={(e) => setNewProduct({...newProduct, isFeatured: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ana səhifədə</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddProduct}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                <FaSave className="mr-2" />
                {isSubmitting ? 'Əlavə edilir...' : 'Əlavə et'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Ləğv et
              </button>
            </div>
          </div>
        )}

        {/* Edit Product Form */}
        {editingProduct && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Məhsulu Redaktə Et</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Məhsul Adı *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qiymət *</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kateqoriya</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Artikul</label>
                <input
                  type="text"
                  value={editForm.artikul}
                  onChange={(e) => setEditForm({...editForm, artikul: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kataloq №</label>
                <input
                  type="text"
                  value={editForm.catalogNumber}
                  onChange={(e) => setEditForm({...editForm, catalogNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stok</label>
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({...editForm, stock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Təsvir</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktiv</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.isFeatured}
                    onChange={(e) => setEditForm({...editForm, isFeatured: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ana səhifədə</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleEditProduct}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                <FaSave className="mr-2" />
                {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Ləğv et
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şəkil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kateqoriya
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artikul
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qiymət
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Əməliyyatlar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-gray-600">Məhsullar yüklənir...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      Məhsul tapılmadı
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const sibling = target.nextElementSibling as HTMLElement;
                                if (sibling) {
                                  sibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <span className="text-gray-500 text-xs" style={{ display: product.image ? 'none' : 'flex' }}>
                            IMG
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.catalogNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.artikul || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.price > 0 ? `${product.price} ₽` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stock > 0 ? product.stock : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Aktiv' : 'Deaktiv'}
                          </span>
                          {product.isFeatured && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Ana səhifə
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() => startEdit(product)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Redaktə"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Sil"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 