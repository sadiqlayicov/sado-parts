# Category Filtering Fix - Kateqoriya Filtrasiyası Probleminin Həlli

## 🚨 Problem

Kateqoriya bölməsində hər hansı bir kateqoriyanı və ya onun alt kateqoriyasını seçən zaman məhsullar görünmür. Yalnız "Sıfırla filtr" verdikdən sonra ümumi məhsullar görünür.

**Xəta**: 500 Internal Server Error
**URL**: `/api/products?categoryId=cat-hydraulic`

## 🔍 Problemin Səbəbi

Vercel deployment-da `DATABASE_URL` environment variable-ı təyin edilməyib. Bu səbəbdən:

1. Kateqoriya filtrasiyası işləmir
2. API 500 xətası qaytarır
3. Məhsullar görünmür

## ✅ Həll

### 1. Vercel Dashboard-a daxil olun
- https://vercel.com/dashboard
- `sado-parts` layihəsini seçin

### 2. Environment Variables təyin edin
- Sol menyuda "Settings" klikləyin
- "Environment Variables" bölməsinə keçin

### 3. Aşağıdakı environment variable-ı əlavə edin:

**Name**: `DATABASE_URL`
**Value**: `postgresql://postgres.chiptvdjdcvuowfiggwe:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:6543/postgres`
**Environment**: Production və Preview (hər ikisini seçin)

### 4. Save və Redeploy
- "Save" düyməsini klikləyin
- "Deployments" bölməsinə keçin
- "Redeploy" düyməsini klikləyin

## 🧪 Test Etmək

Deploy tamamlandıqdan sonra:

1. **Catalog səhifəsi**: https://sado-parts.vercel.app/catalog
2. **Kateqoriya seçin**: "Hidravlika" və ya hər hansı başqa kateqoriya
3. **Məhsulların görünməsini yoxlayın**

### API Test
```bash
# Bu əmri işlədin
node scripts/verify-vercel-env.js
```

**Gözlənilən nəticə**:
- ✅ `/api/categories` - OK
- ✅ `/api/products` - OK  
- ✅ `/api/products?categoryId=cat-hydraulic` - OK (500 əvəzinə 200)

## 🔧 Texniki Detallar

### Problemin Səbəbi
```javascript
// src/app/api/products/route.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ← Bu undefined-dır Vercel-də
  ssl: { rejectUnauthorized: false }
});
```

### Həll Sonrası
```javascript
// Environment variable təyin edildikdən sonra
const pool = new Pool({
  connectionString: "postgresql://...", // ← Düzgün connection string
  ssl: { rejectUnauthorized: false }
});
```

## 📊 Kateqoriya Strukturu

Mövcud kateqoriyalar:
- **cat-hydraulic** (Hidravlika) - Ana kateqoriya
  - **cat_1755516502456** (test alt kateqoriya) - Alt kateqoriya

Kateqoriya seçildikdə:
1. Ana kateqoriyanın məhsulları göstərilir
2. Alt kateqoriyaların məhsulları da göstərilir
3. Ümumi 13 məhsul tapılır

## 🚀 Növbəti Addımlar

1. Environment variable-ı təyin edin
2. Redeploy edin
3. Test edin
4. Əgər işləyirsə, problem həll olunub

## 📞 Dəstək

Əgər problem davam edirsə:
1. Vercel logs-ı yoxlayın
2. Environment variable-ın düzgün təyin edildiyini təsdiqləyin
3. Database connection-ı test edin

---

**Qeyd**: Bu həll kateqoriya filtrasiyası problemini tamamilə həll edəcək və məhsulların düzgün görünməsini təmin edəcək.
