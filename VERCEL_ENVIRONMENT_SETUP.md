# Vercel Environment Variables Setup

## 🔧 Problemin Həlli

Vercel-də Supabase connection problemi həll etmək üçün environment variables-ları düzgün təyin etmək lazımdır.

## 📋 Vercel Dashboard-da Environment Variables Təyin Etmək

### 1. Vercel Dashboard-a daxil olun
- https://vercel.com/dashboard
- Layihənizi seçin: `sado-parts`

### 2. Settings > Environment Variables bölməsinə keçin
- Sol menyuda "Settings" klikləyin
- "Environment Variables" bölməsinə keçin

### 3. Aşağıdakı environment variables-ları əlavə edin:

#### Production Environment:
```
DATABASE_URL=postgresql://postgres.chiptvdjdcvuowfiggwe:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://chiptvdjdcvuowfiggwe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaXB0dmRqZGN2dW93ZmlnZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY4NzI5MCwiZXhwIjoyMDUxMjYzMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8
```

#### Preview Environment:
```
DATABASE_URL=postgresql://postgres.chiptvdjdcvuowfiggwe:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://chiptvdjdcvuowfiggwe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaXB0dmRqZGN2dU93ZmlnZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY4NzI5MCwiZXhwIjoyMDUxMjYzMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8
```

### 4. "Save" düyməsini klikləyin

### 5. Yenidən Deploy
- "Deployments" bölməsinə keçin
- "Redeploy" düyməsini klikləyin

## 🔍 Test Etmək

Deploy tamamlandıqdan sonra:

1. **Ana səhifə**: https://sado-parts.vercel.app
2. **Admin panel**: https://sado-parts.vercel.app/admin
3. **Categories API**: https://sado-parts.vercel.app/api/categories
4. **Products API**: https://sado-parts.vercel.app/api/products
5. **Catalog səhifəsi**: https://sado-parts.vercel.app/catalog

## ⚠️ Təhlükəsizlik Qeydi

Bu hardcoded credentials müvəqqəti həlldir. Təhlükəsizlik üçün:

1. Environment variables-ları Vercel-də düzgün təyin edin
2. Hardcoded credentials-ları koddan silin
3. Service role key-i təhlükəsiz saxlayın

## 🚀 Növbəti Addımlar

1. Environment variables-ları Vercel-də təyin edin
2. Test edin
3. Əgər işləyirsə, hardcoded credentials-ları koddan silin
4. Yenidən deploy edin

## 🔧 Əlavə Qeydlər

- **DATABASE_URL** ən vacib environment variable-dır və məhsulların kateqoriya filtrasiyası üçün lazımdır
- Bu URL Supabase PostgreSQL verilənlər bazasına qoşulmaq üçün istifadə olunur
- Environment variable təyin edilmədikdə API 500 xətası qaytarır

---

**Qeyd**: Bu təlimatlar müvəqqəti həll üçündür. Uzun müddətli həll üçün environment variables-ları düzgün konfiqurasiya etmək lazımdır.
