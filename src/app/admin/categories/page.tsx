"use client";
import { useEffect, useState } from "react";
import { formatId, resetIdCounter } from '@/lib/utils';

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
      let categoriesArray = [];
      if (data.success && Array.isArray(data.data)) {
        categoriesArray = data.data;
      } else if (Array.isArray(data)) {
        categoriesArray = data;
      }
      setCategories(categoriesArray);
      
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
      extractCategories(categoriesArray);
      setParentCategories(allCategories);
      
      console.log('Categories set:', categoriesArray);
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
  const renderCategories = (cats: Category[], level: number) => {
    return cats.map((cat) => (
      <>
        <tr key={cat.id} style={{ background: '#232b3b', borderBottom: '1px solid #333' }}>
          <td style={{ border: "1px solid #333", padding: 8, paddingLeft: 8 + (level * 20) }}>
            {formatId(cat.id)}
          </td>
          <td style={{ border: "1px solid #333", padding: 8, paddingLeft: 8 + (level * 20) }}>
            {editing?.id === cat.id ? (
              <input value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: 6, borderRadius: 3, border: '1px solid #333', background: '#1a2233', color: '#fff', width: '100%' }} />
            ) : (
              <span style={{ fontWeight: level === 0 ? 'bold' : 'normal' }}>
                {level > 0 && '└─ '}{cat.name}
              </span>
            )}
          </td>
          <td style={{ border: "1px solid #333", padding: 8 }}>{editing?.id === cat.id ? (
            <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ padding: 6, borderRadius: 3, border: '1px solid #333', background: '#1a2233', color: '#fff', width: '100%' }} />
          ) : cat.description || "-"}</td>
          <td style={{ border: "1px solid #333", padding: 8 }}>
            {editing?.id === cat.id ? (
              <select 
                value={editParentId} 
                onChange={e => setEditParentId(e.target.value)} 
                style={{ padding: 6, borderRadius: 3, border: '1px solid #333', background: '#1a2233', color: '#fff', width: '100%' }}
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
          <td style={{ border: "1px solid #333", padding: 8, textAlign: 'center', minWidth: 180 }}>
            {editing?.id === cat.id ? (
              <>
                <button 
                  onClick={saveEdit} 
                  disabled={isSubmitting}
                  style={{ 
                    marginRight: 8, 
                    padding: "6px 16px", 
                    background: isSubmitting ? "#666" : "#0af", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 4, 
                    fontWeight: 600, 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                </button>
                <button 
                  onClick={() => setEditing(null)} 
                  disabled={isSubmitting}
                  style={{ 
                    padding: "6px 16px", 
                    background: "#888", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 4, 
                    fontWeight: 600, 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  Ləğv et
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => startEdit(cat)} 
                  disabled={isSubmitting}
                  style={{ 
                    marginRight: 8, 
                    padding: "6px 16px", 
                    background: "#0af", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 4, 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                >
                  Redaktə
                </button>
                <button 
                  onClick={() => deleteCategory(cat.id)} 
                  disabled={isSubmitting}
                  style={{ 
                    padding: "6px 16px", 
                    background: "#f44", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 4, 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                >
                  Sil
                </button>
              </>
            )}
          </td>
        </tr>
        {cat.children && cat.children.length > 0 && renderCategories(cat.children, level + 1)}
      </>
    ));
  };

  return (
    <div style={{ maxWidth: '100%', margin: "40px auto", background: "#232b3b", color: "#fff", padding: 24, borderRadius: 10, boxShadow: '0 4px 24px #0002' }}>
      <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: 'left', letterSpacing: 1 }}>Категории</h2>
      
      {/* Success Message */}
      {successMessage && (
        <div style={{ 
          background: "#4CAF50", 
          color: "#fff", 
          padding: "12px 16px", 
          borderRadius: 6, 
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#fff', 
              fontSize: 18, 
              cursor: 'pointer',
              padding: 0,
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div style={{ 
          background: "#f44336", 
          color: "#fff", 
          padding: "12px 16px", 
          borderRadius: 6, 
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#fff', 
              fontSize: 18, 
              cursor: 'pointer',
              padding: 0,
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {loading ? <div>Загрузка...</div> : null}
      
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          value={newName} 
          onChange={e => setNewName(e.target.value)} 
          placeholder="Yeni kateqoriya adı" 
          style={{ padding: 8, width: 200, borderRadius: 4, border: '1px solid #333', background: '#1a2233', color: '#fff' }} 
        />
        <input 
          value={newDesc} 
          onChange={e => setNewDesc(e.target.value)} 
          placeholder="Təsvir (optional)" 
          style={{ padding: 8, width: 220, borderRadius: 4, border: '1px solid #333', background: '#1a2233', color: '#fff' }} 
        />
        <select 
          value={newParentId} 
          onChange={e => setNewParentId(e.target.value)} 
          style={{ padding: 8, width: 180, borderRadius: 4, border: '1px solid #333', background: '#1a2233', color: '#fff' }}
        >
          <option value="">Ana kateqoriya seçin</option>
          {parentCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input 
          type="number"
          value={newSortOrder} 
          onChange={e => setNewSortOrder(parseInt(e.target.value) || 0)} 
          placeholder="Sıra" 
          style={{ padding: 8, width: 80, borderRadius: 4, border: '1px solid #333', background: '#1a2233', color: '#fff' }} 
        />
        <button 
          onClick={addCategory} 
          disabled={isSubmitting}
          style={{ 
            padding: "8px 18px", 
            background: isSubmitting ? "#666" : "#0af", 
            color: "#fff", 
            border: "none", 
            borderRadius: 4, 
            fontWeight: 600, 
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Əlavə edilir...' : 'Əlavə et'}
        </button>
      </div>
      
      <div style={{overflowX:'auto'}}>
        <table style={{ width: "100%", background: "#1a2233", color: "#fff", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #333", padding: 8, fontWeight: 700, background:'#232b3b', textAlign:'left' }}>ID</th>
              <th style={{ border: "1px solid #333", padding: 8, fontWeight: 700, background:'#232b3b', textAlign:'left' }}>Ad</th>
              <th style={{ border: "1px solid #333", padding: 8, fontWeight: 700, background:'#232b3b', textAlign:'left' }}>Təsvir</th>
              <th style={{ border: "1px solid #333", padding: 8, fontWeight: 700, background:'#232b3b', textAlign:'left' }}>Ana Kateqoriya</th>
              <th style={{ border: "1px solid #333", padding: 8, fontWeight: 700, background:'#232b3b', textAlign:'center' }}>Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {renderCategories(categories, 0)}
          </tbody>
        </table>
      </div>
    </div>
  );
} 