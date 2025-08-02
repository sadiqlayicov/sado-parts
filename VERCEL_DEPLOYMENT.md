# Vercel Deployment Guide - Sado Parts

Bu sənəd Vercel-də layihəni deploy etmək və database problemini həll etmək üçün addım-addım təlimatları təqdim edir.

## 🔧 Problemin Həlli

### 1. Database Connection Problemi
Layihə deploy olunur amma database-dən məlumatlar göstərilmir. Bu problem aşağıdakı səbəblərdən ola bilər:

- **Prisma Client Konfiqurasiyası**: Vercel-in serverless mühitində Prisma client düzgün konfiqurasiya edilməyib
- **Environment Variables**: DATABASE_URL Vercel-də düzgün təyin edilməyib
- **Database Migrations**: Database schema yenilənməyib
- **Connection Pooling**: Supabase ilə Vercel arasında connection problemi

### 2. Həll Yolları

#### A. Vercel Environment Variables Təyin Etmək

1. Vercel Dashboard-da layihənizə daxil olun
2. Settings > Environment Variables bölməsinə keçin
3. Aşağıdakı dəyişənləri əlavə edin:

```
DATABASE_URL=postgresql://postgres.chiptvdjdcvuowfiggwe:R5oWsBhGddRihdJb@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.chiptvdjdcvuowfiggwe:R5oWsBhGddRihdJb@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
```

**Qeyd**: 
- `DATABASE_URL` - Supabase connection pooling üçün
- `DIRECT_URL` - Birbaşa connection üçün (migrations zamanı)

#### B. Database Migrations İşə Salmaq

1. **Yerli olaraq test edin**:
```bash
npm run setup-vercel
```

2. **Vercel-də deploy zamanı**:
```bash
npm run vercel-build
```

Bu komanda avtomatik olaraq:
- Prisma client generate edir
- Database migrations işə salır
- Next.js build edir

#### C. Database Status Yoxlamaq

1. **Test endpoint**: `/api/test-db`
2. **Yerli test**: `npm run check-db`

## 🚀 Deployment Addımları

### 1. Əvvəlki Hazırlıq

```bash
# Dependencies yüklə
npm install

# Prisma client generate et
npx prisma generate

# Database connection test et
npm run setup-vercel
```

### 2. Vercel-də Deploy

1. **GitHub-da kod push edin**
2. **Vercel Dashboard-da**:
   - New Project > Import Git Repository
   - Framework: Next.js
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`

3. **Environment Variables əlavə edin** (yuxarıda göstərildiyi kimi)

4. **Deploy edin**

### 3. Post-Deployment Yoxlama

1. **Database connection test edin**:
   ```
   https://your-app.vercel.app/api/test-db
   ```

2. **Ana səhifəni yoxlayın**:
   ```
   https://your-app.vercel.app
   ```

3. **Vercel logs yoxlayın**:
   - Vercel Dashboard > Functions > View Function Logs

## 🔍 Problemin Diaqnozu

### Database Connection Problemi

Əgər `/api/test-db` endpoint-i xəta verirsə:

1. **Environment Variables yoxlayın**:
   - Vercel Dashboard > Settings > Environment Variables
   - DATABASE_URL və DIRECT_URL mövcud olmalıdır

2. **Database URL formatını yoxlayın**:
   ```
   postgresql://username:password@host:port/database
   ```

3. **Supabase connection yoxlayın**:
   - Supabase Dashboard > Settings > Database
   - Connection string düzgün olmalıdır

### Data Görünməmə Problemi

Əgər səhifə açılır amma məlumatlar görünmürsə:

1. **Database-də məlumat var mı yoxlayın**:
   ```bash
   npm run check-db
   ```

2. **API endpoint-ləri test edin**:
   - `/api/products`
   - `/api/categories`

3. **Browser console-da xətaları yoxlayın**

## 🛠️ Əlavə Həllər

### 1. Prisma Client Reset

Əgər connection problemi davam edirsə:

```bash
# Prisma client reset et
npx prisma generate --force

# Database push et
npx prisma db push
```

### 2. Vercel Function Timeout

Əgər API endpoint-ləri timeout olursa:

1. `vercel.json` faylında timeout artırın:
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### 3. Database Seeding

Əgər database boşdursa:

```bash
# Seed data əlavə et
npm run db-seed
```

## 📞 Dəstək

Əgər problem davam edirsə:

1. **Vercel logs yoxlayın**
2. **Database connection test edin**
3. **Environment variables yoxlayın**
4. **Supabase status yoxlayın**

## 🔄 Yenidən Deploy

Problemi həll etdikdən sonra:

1. **Kod dəyişikliklərini commit edin**
2. **GitHub-a push edin**
3. **Vercel avtomatik deploy edəcək**
4. **Test edin**

---

**Qeyd**: Bu təlimatlar Supabase PostgreSQL database ilə Vercel deployment üçün hazırlanıb. Əgər fərqli database istifadə edirsinizsə, connection string-i uyğunlaşdırın. 