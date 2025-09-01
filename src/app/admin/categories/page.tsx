"use client";
import { useEffect, useState } from "react";
import { formatId, resetIdCounter } from '@/lib/utils';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  parentId?: string;
  sortOrder?: number;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    resetIdCounter(); // Reset ID counter when component mounts
    fetchCategories();
  }, []);

  // Auto-hide messages after 5 seconds
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

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching categories...');
      const res = await fetch("/api/categories", {
        cache: 'no-store'
      });
      
      console.log('Categories response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Categories API Error:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Categories response data:', data);
      
      // API utils istifadə edir və successResponse qaytarır
      let categoriesArray: any[] = [];
      if (data.success && Array.isArray(data.data)) {
        categoriesArray = data.data; // already hierarchical
      } else if (Array.isArray(data)) {
        categoriesArray = data; // fallback
      }
      
      // Build hierarchical structure from flat data
      const buildHierarchy = (flatCategories: any[]): Category[] => {
        const categoryMap = new Map();
        const rootCategories: Category[] = [];
        
        // First pass: create map of all categories
        flatCategories.forEach(cat => {
          categoryMap.set(cat.id, { ...cat, children: [] });
        });
        
        // Second pass: build hierarchy
        flatCategories.forEach(cat => {
          const category = categoryMap.get(cat.id);
          if (cat.parentId && categoryMap.has(cat.parentId)) {
            const parent = categoryMap.get(cat.parentId);
            parent.children.push(category);
          } else {
            rootCategories.push(category);
          }
        });
        
        return rootCategories;
      };
      
      const hierarchicalCategories = buildHierarchy(categoriesArray);
      setCategories(hierarchicalCategories);
      
      // Extract all categories (including children) for parent selection
      const allCategories: Category[] = [];
      const extractCategories = (cats: Category[]) => {
        cats.forEach(cat => {
          allCategories.push(cat);
          if (cat.children && cat.children.length > 0) {
            extractCategories(cat.children);
          }
        });
      };
      extractCategories(hierarchicalCategories);
      setParentCategories(allCategories);
      
      console.log('Categories set:', hierarchicalCategories);
    } catch (e: any) {
      console.error('Error fetching categories:', e);
      setError(e.message || "Kateqoriyalar yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  async function addCategory() {
    if (!newName.trim()) {
      setError("Kateqoriya adı boş ola bilməz");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newName, 
          description: newDesc,
          parentId: newParentId || null,
          sortOrder: newSortOrder
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Add category error:', errorText);
        setError(`Kateqoriya əlavə edilə bilmədi: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
      setNewName("");
      setNewDesc("");
      setNewParentId("");
      setNewSortOrder(0);
      fetchCategories();
        setSuccessMessage('Kateqoriya uğurla əlavə edildi');
      } else {
        setError(`Kateqoriya əlavə edilə bilmədi: ${data.error || 'Naməlum xəta'}`);
      }
    } catch (error: any) {
      console.error('Add category error:', error);
      setError('Kateqoriya əlavə edilərkən xəta baş verdi: ' + (error.message || 'Şəbəkə xətası'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteCategory(id: string) {
    // İlk olaraq kateqoriyada neçə məhsul olduğunu yoxlayaq
    try {
      const checkRes = await fetch(`/api/categories/${id}`);
      if (!checkRes.ok) {
        setError('Kateqoriya məlumatları yoxlanılarkən xəta baş verdi');
        return;
      }
      
      // Kateqoriyada məhsulların sayını yoxlayaq
      const productsRes = await fetch(`/api/products?categoryId=${id}`);
      const productsData = await productsRes.json();
      const productCount = productsData?.data?.length || 0;
      
      let confirmMessage = "Kateqoriyanı silmək istədiyinizə əminsiniz?";
      if (productCount > 0) {
        confirmMessage = `Bu kateqoriyada ${productCount} məhsul var. Kateqoriyanı silsəniz, məhsullar "Ümumi" kateqoriyasına köçürüləcək. Davam etmək istəyirsiniz?`;
      }
      
      if (!window.confirm(confirmMessage)) return;
      
      const res = await fetch(`/api/categories/${id}`, { 
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ forceDelete: productCount > 0 })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Delete category error:', errorText);
        setError(`Kateqoriya silinə bilmədi: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
    fetchCategories();
        if (productCount > 0) {
          setSuccessMessage(`Kateqoriya uğurla silindi və ${productCount} məhsul "Ümumi" kateqoriyasına köçürüldü`);
        } else {
          setSuccessMessage('Kateqoriya uğurla silindi');
        }
      } else {
        setError(`Kateqoriya silinə bilmədi: ${data.error || 'Naməlum xəta'}`);
      }
    } catch (error: any) {
      console.error('Delete category error:', error);
      setError('Kateqoriya silinərkən xəta baş verdi: ' + (error.message || 'Şəbəkə xətası'));
    }
  }

  async function startEdit(cat: Category) {
    setEditing(cat);
    setEditName(cat.name);
    setEditDesc(cat.description || "");
    setEditParentId(cat.parentId || "");
    setEditSortOrder(cat.sortOrder || 0);
  }

  async function saveEdit() {
    if (!editing) return;
    
    if (!editName.trim()) {
      setError("Kateqoriya adı boş ola bilməz");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/categories/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: editName, 
          description: editDesc,
          parentId: editParentId || null,
          sortOrder: editSortOrder
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Update category error:', errorText);
        setError(`Kateqoriya yenilənə bilmədi: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
    setEditing(null);
    fetchCategories();
        setSuccessMessage('Kateqoriya uğurla yeniləndi');
      } else {
        setError(`Kateqoriya yenilənə bilmədi: ${data.error || 'Naməlum xəta'}`);
      }
    } catch (error: any) {
      console.error('Update category error:', error);
      setError('Kateqoriya yenilənərkən xəta baş verdi: ' + (error.message || 'Şəbəkə xətası'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Recursive function to render categories with hierarchy
  const renderCategories = (cats: Category[], level: number): React.ReactElement[] => {
    return cats.map((cat) => (
      <>
        <tr key={cat.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ paddingLeft: 8 + (level * 20) }}>
            {formatId(cat.id)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ paddingLeft: 8 + (level * 20) }}>
            {editing?.id === cat.id ? (
              <input 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <span className={`font-medium ${level === 0 ? 'font-bold' : 'font-normal'}`}>
                {level > 0 && '└─ '}{cat.name}
              </span>
            )}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {editing?.id === cat.id ? (
              <input 
                value={editDesc} 
                onChange={e => setEditDesc(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : cat.description || "-"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {editing?.id === cat.id ? (
              <select 
                value={editParentId} 
                onChange={e => setEditParentId(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Ana kateqoriya yoxdur</option>
                {parentCategories.filter(p => p.id !== cat.id).map((parentCat) => (
                  <option key={parentCat.id} value={parentCat.id}>
                    {parentCat.name}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {cat.parentId ? 
                  parentCategories.find(p => p.id === cat.parentId)?.name || 'Bilinməyən' 
                  : 'Ana kateqoriya'
                }
              </span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
            {editing?.id === cat.id ? (
              <div className="flex space-x-2 justify-center">
                <button 
                  onClick={saveEdit} 
                  disabled={isSubmitting}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                </button>
                <button 
                  onClick={() => setEditing(null)} 
                  disabled={isSubmitting}
                  className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTimes className="w-4 h-4 mr-1" />
                  Ləğv et
                </button>
              </div>
            ) : (
              <div className="flex space-x-2 justify-center">
                <button 
                  onClick={() => startEdit(cat)} 
                  disabled={isSubmitting}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <FaEdit className="w-4 h-4 mr-1" />
                  Redaktə
                </button>
                <button 
                  onClick={() => deleteCategory(cat.id)} 
                  disabled={isSubmitting}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <FaTrash className="w-4 h-4 mr-1" />
                  Sil
                </button>
              </div>
            )}
          </td>
        </tr>
        {cat.children && cat.children.length > 0 && renderCategories(cat.children, level + 1)}
      </>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kateqoriyalar ({categories.length} ədəd)
          </h1>
          <p className="text-gray-600">Kateqoriyaların idarə edilməsi</p>
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

        {/* Add Category Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Yeni Kateqoriya Əlavə Et</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kateqoriya Adı</label>
              <input 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                placeholder="Yeni kateqoriya adı" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Təsvir</label>
              <input 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)} 
                placeholder="Təsvir (optional)" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ana Kateqoriya</label>
              <select 
                value={newParentId} 
                onChange={e => setNewParentId(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Ana kateqoriya yoxdur</option>
                {parentCategories.map((parentCat) => (
                  <option key={parentCat.id} value={parentCat.id}>
                    {parentCat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button 
                onClick={addCategory} 
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Əlavə edilir...' : 'Əlavə et'}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Kateqoriyalar yüklənir...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Təsvir
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ana Kateqoriya
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Əməliyyatlar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renderCategories(categories, 0)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 