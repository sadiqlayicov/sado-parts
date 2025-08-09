'use client';
import { useEffect, useState } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface Product {
  id: string;
  name: string;
  category?: { name: string };
  artikul?: string;
  catalogNumber?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  images?: string[]; // <-- Əlavə olundu
}

interface ProductFormProps {
  initial?: Partial<Product>;
  categories: string[];
  onSave: (data: any) => void;
  onClose: () => void;
}

function ProductForm({ initial = {}, categories, onSave, onClose }: ProductFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: initial.name || '',
    category: initial.category?.name || initial.category || '',
    artikul: initial.artikul || '',
    catalogNumber: initial.catalogNumber || '',
    description: initial.description || '',
    price: initial.price || '',
    isActive: initial.isActive ?? true,
    isFeatured: initial.isFeatured ?? false,
    images: initial.images || [],
  });
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const [newCategory, setNewCategory] = useState('');
  const [categoryList, setCategoryList] = useState<string[]>(categories);
  React.useEffect(() => { setCategoryList(categories); }, [categories]);
  // Backend kateqoriya əlavə et
  const handleAddCategory = async () => {
    if(newCategory && !categoryList.includes(newCategory)){
      try {
        // Backend-ə göndər
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategory })
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Add category error:', errorText);
          alert(`Kateqoriya əlavə edilə bilmədi: ${errorText}`);
          return;
        }
        
        const data = await res.json();
        if (data.success) {
          // YENİ: Kateqoriyaları yenidən fetch et
          const updated = await fetch('/api/categories');
          const updatedData = await updated.json();
          
          let updatedList = [];
          if (updatedData.success && Array.isArray(updatedData.data)) {
            updatedList = updatedData.data.map((c:any)=>c.name);
          } else if (Array.isArray(updatedData)) {
            updatedList = updatedData.map((c:any)=>c.name);
          }
          
          setCategoryList(updatedList);
          setForm(f=>({...f,category:newCategory}));
          setNewCategory('');
          alert('Kateqoriya uğurla əlavə edildi');
        } else {
          alert(`Kateqoriya əlavə edilə bilmədi: ${data.error || 'Naməlum xəta'}`);
        }
      } catch (error) {
        console.error('Add category error:', error);
        alert('Kateqoriya əlavə edilərkən xəta baş verdi');
      }
    }
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const uploaded: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) uploaded.push(data.url);
    }
    setForm(f => ({ ...f, images: [...(f.images || []), ...uploaded] }));
  };
  // Şəkil silmək üçün handler
  const handleImageDelete = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{background:'#232b3b',padding:32,borderRadius:8,minWidth:350,color:'#fff',boxShadow:'0 2px 16px #0008'}}>
        <h3>{initial.id ? t('edit_product', 'Məhsulu redaktə et') : t('add_product', 'Yeni məhsul əlavə et')}</h3>
        <div style={{margin:'12px 0'}}>
          <label>{t('name', 'Ad')}:</label><br/>
          <input name="name" value={form.name} onChange={handleChange} required style={{width:'100%',padding:6,background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:4}} />
        </div>
        <div style={{margin:'12px 0'}}>
          <label>{t('category', 'Kateqoriya')}:</label><br/>
          <select name="category" value={typeof form.category === 'object' ? form.category?.name : form.category} onChange={handleChange} required style={{width:'100%',padding:6,background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:4}}>
            <option value="">{t('select', 'Seçin')}</option>
            {Array.from(new Set(categoryList)).map((cat, idx) => <option key={cat.trim() + '-' + idx} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div style={{margin:'12px 0'}}>
          <label>{t('artikul', 'Artikul')}:</label><br/>
          <input name="artikul" value={form.artikul} onChange={handleChange} style={{width:'100%',padding:6,background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:4}} />
        </div>
        <div style={{margin:'12px 0'}}>
          <label>{t('catalog_number', 'Kataloq №')}:</label><br/>
          <input name="catalogNumber" value={form.catalogNumber} onChange={handleChange} style={{width:'100%',padding:6,background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:4}} />
        </div>
        <div style={{margin:'12px 0'}}>
          <label>{t('description', 'Təsvir')}:</label><br/>
          <textarea name="description" value={form.description} onChange={handleChange} style={{width:'100%',padding:6,background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:4,minHeight:80}} />
        </div>
        <div style={{margin:'12px 0'}}>
          <label>{t('price', 'Qiymət')}:</label><br/>
          <input name="price" type="number" value={form.price} onChange={handleChange} required style={{width:'100%',padding:6,background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:4}} />
        </div>
        {/* Şəkil yükləmə inputu və preview */}
        <div style={{margin:'12px 0'}}>
          <label>{t('upload_image', 'Şəkil yüklə (bir və ya bir neçə)')}:</label><br/>
          <button
            type="button"
            onClick={() => document.getElementById('product-image-upload')?.click()}
            style={{padding:'6px 18px',background:'#0af',color:'#fff',border:'none',borderRadius:4,marginBottom:8,cursor:'pointer'}}
          >
            {t('select_image', 'Şəkil seç')}
          </button>
          <input
            id="product-image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{display:'none'}}
          />
          <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
            {form.images && form.images.map((img, idx) => (
              <div key={idx} style={{position:'relative',display:'inline-block'}}>
                <img src={img} alt="preview" style={{width:60,height:60,objectFit:'cover',borderRadius:6}} />
                <button
                  type="button"
                  onClick={() => handleImageDelete(idx)}
                  style={{position:'absolute',top:2,right:2,background:'#f44',color:'#fff',border:'none',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontWeight:'bold',fontSize:14,padding:0,lineHeight:1}}
                  title={t('delete', 'Sil')}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{margin:'12px 0',display:'flex',gap:16}}>
          <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}/> {t('active', 'Aktiv')}</label>
          <label><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange}/> {t('show_on_home', 'Ana səhifədə göstər')}</label>
        </div>
        <div style={{marginTop:16,display:'flex',gap:12,justifyContent:'flex-end'}}>
          <button type="button" onClick={onClose} style={{padding:'6px 18px'}}>{t('close', 'Bağla')}</button>
          <button type="submit" style={{padding:'6px 18px',background:'#0af',color:'#fff',border:'none',borderRadius:4}}>{initial.id ? t('save', 'Yadda saxla') : t('add', 'Əlavə et')}</button>
        </div>
      </form>
    </div>
  );
}

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product|null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
    async function fetchProductsAndCategories() {
      try {
        console.log('Fetching products and categories...');
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products', {
            cache: 'no-store'
          }),
          fetch('/api/categories', {
            cache: 'no-store'
          })
        ]);
        
        console.log('Products response status:', productsRes.status);
        console.log('Categories response status:', categoriesRes.status);
        
        if (!productsRes.ok) {
          const errorText = await productsRes.text();
          console.error('Products API Error:', errorText);
          throw new Error(`Products API error: ${productsRes.status}`);
        }
        
        if (!categoriesRes.ok) {
          const errorText = await categoriesRes.text();
          console.error('Categories API Error:', errorText);
          throw new Error(`Categories API error: ${categoriesRes.status}`);
        }
        
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        
        console.log('Products response data:', productsData);
        console.log('Categories response data:', categoriesData);
        
        // Handle products data
        let productsArray = [];
        if (productsData.success && Array.isArray(productsData.data)) {
          productsArray = productsData.data;
        } else if (Array.isArray(productsData)) {
          productsArray = productsData;
        }
        setProducts(productsArray);
        
        // Handle categories data
        let categoriesArray = [];
        if (categoriesData.success && Array.isArray(categoriesData.data)) {
          categoriesArray = categoriesData.data.map((c:any)=>c.name);
        } else if (Array.isArray(categoriesData)) {
          categoriesArray = categoriesData.map((c:any)=>c.name);
        }
        setCategories(categoriesArray);
        
        console.log('Products set:', productsArray.length);
        console.log('Categories set:', categoriesArray);
      } catch (err: any) {
        console.error('Error fetching products and categories:', err);
        setError(err.message || 'Məhsullar və kateqoriyalar yüklənərkən xəta baş verdi');
      } finally {
        setLoading(false);
      }
    }
    fetchProductsAndCategories();
  }, []);

  // Modal açılan kimi kateqoriyaları yenilə
  useEffect(() => {
    if (showForm) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          let categoriesArray = [];
          if (data.success && Array.isArray(data.data)) {
            categoriesArray = data.data.map((c:any)=>c.name);
          } else if (Array.isArray(data)) {
            categoriesArray = data.map((c:any)=>c.name);
          }
          setCategories(categoriesArray);
        })
        .catch(err => console.error('Error updating categories:', err));
    }
  }, [showForm]);

  // Filtrlənmiş məhsullar
  const filteredProducts = products.filter(product => {
    // YENİ: product undefined olarsa skip et
    if (!product) return false;
    
    const matchesSearch =
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.artikul?.toLowerCase().includes(search.toLowerCase()) ||
      product.catalogNumber?.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter
      ? (
          (product.category && typeof product.category === 'object' && product.category.name === categoryFilter) ||
          (typeof product.category === 'string' && product.category === categoryFilter)
        )
      : true;
    return matchesSearch && matchesCategory;
  });

  // Səhifələmə
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, pageSize === -1 ? undefined : currentPage * pageSize);

  // Kateqoriyaları çıxarmaq üçün ayrıca dəyişən yoxdur, yalnız state-dəki 'categories' istifadə olunur.

  const handleAdd = () => { setEditProduct(null); setShowForm(true); };
  const handleEdit = (product: Product) => { setEditProduct(product); setShowForm(true); };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Məhsulu silmək istədiyinizə əminsiniz?')) return;
    setSaving(true);
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(p => p.filter(pr => pr.id !== id));
    setSaving(false);
  };
  const handleSave = async (data: any) => {
    setSaving(true);
    let categoryId = null;
    // Mövcud kateqoriyalardan id-ni tap
    const categoriesRes = await fetch('/api/categories');
    const categoriesData = await categoriesRes.json();
    
    let categoriesArray = [];
    if (categoriesData.success && Array.isArray(categoriesData.data)) {
      categoriesArray = categoriesData.data;
    } else if (Array.isArray(categoriesData)) {
      categoriesArray = categoriesData;
    }
    
    const found = categoriesArray.find((c:any)=>c.name===data.category);
    if(found) categoryId = found.id;
    else if(data.category) {
      // Yeni kateqoriyanı backend-ə əlavə et
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.category })
      });
      const cat = await res.json();
      categoryId = cat.id;
    }
    let product: any;
    if (editProduct) {
      // Redaktə
      const res = await fetch(`/api/products/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          artikul: data.artikul || '',
          catalogNumber: data.catalogNumber || '',
          description: data.description || '',
          price: data.price ? parseFloat(data.price) : 0,
          categoryId,
          isActive: !!data.isActive,
          isFeatured: !!data.isFeatured,
        })
      });
      const result = await res.json();
      
      // YENİ: Response-u yoxla
      if (!res.ok) {
        console.error('Ошибка backend:', result);
        alert(`Товар не может быть обновлен! ${result.message || 'Произошла ошибка.'}`);
        setSaving(false);
        return;
      }
      
      product = result.product || result;
      console.log('UPDATED PRODUCT RESPONSE:', product); // Debug üçün əlavə olundu
      
      // YENİ: product undefined olarsa error throw et
      if (!product) {
        console.error('Backend-dən product gəlmədi:', result);
        alert('Товар не может быть обновлен! Ошибка backend.');
        setSaving(false);
        return;
      }
      
      if (product.artikul !== undefined && product.catalogNumber !== undefined) {
        setProducts(p => p.map(pr => pr.id === product.id ? product : pr));
      } else if (typeof product.artikul === 'string' && typeof product.catalogNumber === 'string') {
        setProducts(p => p.map(pr => pr.id === product.id ? product : pr));
      } else {
        alert('Backend-dən artikul və catalogNumber gəlmədi!');
      }
    } else {
      // Əlavə et
      const requestData = {
        ...data,
        artikul: data.artikul || '',
        catalogNumber: data.catalogNumber || '',
        description: data.description || '',
        price: data.price ? parseFloat(data.price) : 0,
        categoryId,
        isActive: !!data.isActive,
        isFeatured: !!data.isFeatured,
        images: data.images || [],
      };
      
      console.log('Sending data to backend:', JSON.stringify(requestData, null, 2));
      
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));
      
      const result = await res.json();
      console.log('Response body:', JSON.stringify(result, null, 2));
      
      // YENİ: Response-u yoxla
      if (!res.ok) {
        console.error('Ошибка backend:', result);
        alert(`Товар не может быть добавлен! ${result.error || result.message || 'Произошла ошибка.'}`);
        setSaving(false);
        return;
      }
      
      product = result.product || result;
      
      // YENİ: product undefined olarsa error throw et
      if (!product) {
        console.error('Backend-dən product gəlmədi:', result);
        alert('Товар не может быть добавлен! Ошибка backend.');
        setSaving(false);
        return;
      }
      
      // YENİ: category obyektini düzəlt
      setProducts(p => [
        {
          ...product,
          category: typeof product.category === 'object'
            ? product.category
            : { name: data.category }
        },
        ...p
      ]);
    }
    setShowForm(false);
    setEditProduct(null);
    setSaving(false);
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div style={{color:'red'}}>Ошибка: {error}</div>;

  return (
    <div>
      <h2>Məhsullar <span style={{fontWeight:'normal',fontSize:'16px'}}>({totalProducts} ədəd)</span></h2>
      <button onClick={handleAdd} style={{marginBottom:12,padding:'8px 18px',background:'#0af',color:'#fff',border:'none',borderRadius:4,fontWeight:'bold'}}>{t('add_product', '+ Məhsul əlavə et')}</button>
      <div style={{display:'flex',gap:'16px',marginBottom:'16px',flexWrap:'wrap',alignItems:'center'}}>
        <input
          type="text"
          placeholder={t('search_placeholder', 'Axtarış... (ad, artikul, kataloq nömrəsi, təsvir)')}
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          style={{padding:'8px',borderRadius:'4px',border:'1px solid #333',minWidth:'220px'}}
        />
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          style={{padding:'8px',borderRadius:'4px',border:'1px solid #333',background:'#232b3b',color:'#fff'}}
        >
                          <option value="">{t('all_categories', 'Все категории')}</option>
          {Array.from(new Set(categories)).map((cat, idx) => (
            <option key={cat + '-' + idx} value={cat}>{cat}</option>
          ))}
        </select>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'8px'}}>
          <span>{t('products_per_page', 'Bir səhifədə:')}</span>
          <select
            value={pageSize}
            onChange={e => {
              const val = e.target.value === '-1' ? -1 : parseInt(e.target.value, 10);
              setPageSize(val);
              setCurrentPage(1);
            }}
            style={{padding:'8px',borderRadius:'4px',border:'1px solid #333',background:'#232b3b',color:'#fff'}}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
            <option value={-1}>{t('all_products', 'Hamısı')}</option>
          </select>
          <div style={{display:'flex',gap:'8px',alignItems:'center',marginLeft:'24px'}}>
            <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} style={{padding:'6px 12px'}}>{t('previous', 'Əvvəlki')}</button>
            <span>{t('page', 'Səhifə')} {currentPage} / {totalPages}</span>
            <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} style={{padding:'6px 12px'}}>{t('next', 'Növbəti')}</button>
          </div>
        </div>
      </div>
      <table style={{width:'100%',background:'#1a2233',color:'#fff',borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('image', 'Şəkil')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('id', 'ID')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('name', 'Ad')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('category', 'Kateqoriya')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('artikul', 'Artikul')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('catalog_number', 'Kataloq №')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('description', 'Təsvir')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('price', 'Qiymət')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('active', 'Aktiv')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('show_on_home', 'Ana səhifədə')}</th>
            <th style={{border:'1px solid #333',padding:'8px'}}>{t('actions', 'Əməliyyatlar')}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.map(product => {
            // YENİ: product undefined olarsa skip et
            if (!product) return null;
            return (
            <tr key={product.id}>
              <td style={{border:'1px solid #333',padding:'8px',textAlign:'center'}}>
                {product.images && product.images.length > 0 && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
                    onError={e => (e.currentTarget.src = '/placeholder.png')}
                  />
                ) : (
                  <img
                    src="/placeholder.png"
                    alt="placeholder"
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
                  />
                )}
              </td>
              <td style={{border:'1px solid #333',padding:'8px'}}>{product.id}</td>
              <td style={{border:'1px solid #333',padding:'8px'}}>{product.name}</td>
              <td style={{border:'1px solid #333',padding:'8px'}}>{product.category?.name || '-'}</td>
              <td style={{border:'1px solid #333',padding:'8px'}}>{product.artikul || '-'}</td>
              <td style={{border:'1px solid #333',padding:'8px'}}>{product.catalogNumber || '-'}</td>
              <td style={{border:'1px solid #333',padding:'8px'}}>{product.description || '-'}</td>
              <td style={{border:'1px solid #333',padding:'8px'}}>{product.price}</td>
              <td style={{border:'1px solid #333',padding:'8px',textAlign:'center'}}>
                <input type="checkbox" checked={!!product.isActive} onChange={async e => {
                  setSaving(true);
                  const res = await fetch(`/api/products/${product.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: e.target.checked })
                  });
                  const updated = await res.json();
                  setProducts(p => p.map(pr => pr.id === product.id ? updated : pr));
                  setSaving(false);
                }} style={{width:18,height:18,cursor:'pointer',accentColor:'#0af'}} />
              </td>
              <td style={{border:'1px solid #333',padding:'8px',textAlign:'center'}}>
                <input type="checkbox" checked={!!product.isFeatured} onChange={async e => {
                  setSaving(true);
                  const res = await fetch(`/api/products/${product.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isFeatured: e.target.checked })
                  });
                  const updated = await res.json();
                  setProducts(p => p.map(pr => pr.id === product.id ? updated : pr));
                  setSaving(false);
                }} style={{width:18,height:18,cursor:'pointer',accentColor:'#ffb300'}} />
              </td>
              <td style={{border:'1px solid #333',padding:'8px',textAlign:'center'}}>
                <button onClick={() => handleEdit(product)} style={{marginRight:4,padding:'2px 8px',fontSize:'13px',background:'#232b3b',color:'#fff',border:'1px solid #0af',borderRadius:4,cursor:'pointer',transition:'0.2s',display:'inline-block'}}>{t('edit', 'Redaktə')}</button>
                <button onClick={() => handleDelete(product.id)} style={{padding:'2px 8px',fontSize:'13px',background:'#f44',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',transition:'0.2s',display:'inline-block'}}>{t('delete', 'Sil')}</button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      {showForm && (
        <ProductForm
          initial={editProduct || undefined}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
        />
      )}
      {saving && <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.2)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{background:'#232b3b',padding:32,borderRadius:8,color:'#fff'}}>{t('saving', 'Yadda saxlanılır...')}</div></div>}
    </div>
  );
} 