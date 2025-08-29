# Sequential Order Numbers - Ardıcıl Sifariş Nömrələri Sistemi

## 🎯 Problem

Sifariş nömrələri təsadüfi formatda yaradılırdı:
- **Əvvəlki format**: `ORD-1756473545516-8nwj4l` (timestamp + random)
- **Problem**: Nömrələr ardıcıl deyildi və izləmək çətin idi

## ✅ Həll

Sifariş nömrələrini "BP0000001" formatında ardıcıl olaraq yaradılacaq sistemi tətbiq etdim:

### 🎯 Yeni Format
- **Format**: `BP` + 7 rəqəm (məsələn: BP0000001, BP0000002, BP0000003...)
- **Başlanğıc**: BP0000001
- **Ardıcıllıq**: Hər yeni sifariş növbəti nömrəni alır

## 🔧 Texniki İmplementasiya

### 1. Yeni API Endpoint

#### **`src/app/api/orders/next-number/route.ts`**
```typescript
export async function GET(request: NextRequest) {
  // Get the highest order number from the database
  const result = await client.query(`
    SELECT "orderNumber" 
    FROM orders 
    WHERE "orderNumber" LIKE 'BP%' 
    ORDER BY CAST(SUBSTRING("orderNumber" FROM 3) AS INTEGER) DESC 
    LIMIT 1
  `);
  
  let nextNumber = 1;
  
  if (result.rows.length > 0) {
    const lastOrderNumber = result.rows[0].orderNumber;
    const numberPart = lastOrderNumber.substring(2);
    nextNumber = parseInt(numberPart) + 1;
  }
  
  // Format: BP0000001, BP0000002, etc.
  const nextOrderNumber = `BP${nextNumber.toString().padStart(7, '0')}`;
  
  return NextResponse.json({
    success: true,
    nextOrderNumber: nextOrderNumber,
    nextNumber: nextNumber
  });
}
```

### 2. Cart Səhifəsinin Yenilənməsi

#### **`src/app/cart/page.tsx`**
```typescript
// Get the next sequential order number
const orderNumberResponse = await fetch('/api/orders/next-number');
const orderNumberData = await orderNumberResponse.json();

if (!orderNumberData.success) {
  alert('Ошибка при получении номера заказа');
  return;
}

const orderNumber = orderNumberData.nextOrderNumber;
```

## 🧪 Test Nəticələri

### Test Skripti: `scripts/test-order-numbers.js`
```bash
node scripts/test-order-numbers.js
```

**Nəticə**:
```
✅ Next order number: BP0000001
✅ Order created successfully: BP0000001
✅ Next order number: BP0000002
✅ Sequential numbering working correctly!
```

## 📊 Sistemin İşləmə Prinsipi

### 1. **İlk Sifariş**
- Database boş olduğu üçün növbəti nömrə: 1
- Sifariş nömrəsi: **BP0000001**

### 2. **İkinci Sifariş**
- Ən yüksək nömrə: BP0000001 (nömrə: 1)
- Növbəti nömrə: 1 + 1 = 2
- Sifariş nömrəsi: **BP0000002**

### 3. **Üçüncü Sifariş**
- Ən yüksək nömrə: BP0000002 (nömrə: 2)
- Növbəti nömrə: 2 + 1 = 3
- Sifariş nömrəsi: **BP0000003**

## 🔍 SQL Sorgusu

Sistem bu SQL sorgusu ilə ən yüksək nömrəni tapır:
```sql
SELECT "orderNumber" 
FROM orders 
WHERE "orderNumber" LIKE 'BP%' 
ORDER BY CAST(SUBSTRING("orderNumber" FROM 3) AS INTEGER) DESC 
LIMIT 1
```

**Açıqlama**:
- `"orderNumber" LIKE 'BP%'` - Yalnız BP ilə başlayan nömrələri seçir
- `SUBSTRING("orderNumber" FROM 3)` - BP-dən sonrakı hissəni alır
- `CAST(...AS INTEGER)` - Mətn nömrəsini ədədə çevirir
- `ORDER BY ... DESC` - Ən yüksək nömrədən başlayaraq sıralayır

## 🚀 Avantajlar

### **Əvvəlki Sistem**:
- ❌ Təsadüfi nömrələr
- ❌ İzləmək çətin
- ❌ Professional görünmür
- ❌ Ardıcıllıq yoxdur

### **Yeni Sistem**:
- ✅ Ardıcıl nömrələr
- ✅ Asan izləmək
- ✅ Professional görünüş
- ✅ BP0000001 formatında
- ✅ 7 rəqəmli format (1 milyon sifarişə qədər)

## 📈 Məhdudiyyətlər

- **Maksimum sifariş sayı**: 9,999,999 (BP9999999)
- **Format**: BP + 7 rəqəm
- **Başlanğıc**: BP0000001

## 🔄 İstifadəçi Təcrübəsi

### **Sifariş Yaratma Prosesi**:
1. İstifadəçi səbətə məhsul əlavə edir
2. "Оформить заказ" düyməsini basır
3. Sistem avtomatik olaraq növbəti nömrəni alır
4. Sifariş yaradılır (məsələn: BP0000001)
5. Növbəti sifariş BP0000002 olacaq

## 📝 Növbəti Addımlar

1. **Vercel avtomatik deploy edəcək** (GitHub-a push etdiyimiz üçün)
2. **Test edin**: Yeni sifariş yaradın və nömrələrin ardıcıl olduğunu yoxlayın
3. **Admin panelində**: Sifarişlər BP0000001, BP0000002 formatında görünəcək

---

**Qeyd**: Bu sistem bütün yeni sifarişlər üçün BP0000001 formatında ardıcıl nömrələr təmin edir və professional görünüş yaradır.
