-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "salePrice" REAL,
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalAmount" REAL NOT NULL,
    "shippingAddress" TEXT,
    "billingAddress" TEXT,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "import_export" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" REAL NOT NULL DEFAULT 0,
    "totalItems" INTEGER,
    "processedItems" INTEGER DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "marketplaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Məhsullar üçün
create policy "Allow all select" on products for select using (true);
-- Kateqoriyalar üçün
create policy "Allow all select" on categories for select using (true);
-- İstifadəçilər üçün (əgər lazım olsa)
create policy "Allow all select" on users for select using (true);

INSERT INTO users ("id", "email", "password", "firstName", "lastName", "phone", "role", "isApproved", "isActive", "createdAt", "updatedAt")
VALUES
  ('admin-1', 'admin@sado-parts.ru', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Admin', 'User', NULL, 'ADMIN', true, true, NOW(), NOW()),
  ('manager-1', 'manager@sado-parts.ru', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Manager', 'User', NULL, 'MANAGER', true, true, NOW(), NOW());

INSERT INTO users ("id", "email", "password", "firstName", "lastName", "phone", "role", "isApproved", "isActive", "createdAt", "updatedAt")
VALUES
  ('customer-1', 'customer1@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri1', 'Soyad1', '+994 50 000 01', 'CUSTOMER', true, true, NOW(), NOW()),
  ('customer-2', 'customer2@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri2', 'Soyad2', '+994 50 000 02', 'CUSTOMER', false, true, NOW(), NOW()),
  ('customer-3', 'customer3@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri3', 'Soyad3', '+994 50 000 03', 'CUSTOMER', true, true, NOW(), NOW()),
  ('customer-4', 'customer4@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri4', 'Soyad4', '+994 50 000 04', 'CUSTOMER', false, true, NOW(), NOW()),
  ('customer-5', 'customer5@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri5', 'Soyad5', '+994 50 000 05', 'CUSTOMER', true, true, NOW(), NOW()),
  ('customer-6', 'customer6@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri6', 'Soyad6', '+994 50 000 06', 'CUSTOMER', false, true, NOW(), NOW()),
  ('customer-7', 'customer7@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri7', 'Soyad7', '+994 50 000 07', 'CUSTOMER', true, true, NOW(), NOW()),
  ('customer-8', 'customer8@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri8', 'Soyad8', '+994 50 000 08', 'CUSTOMER', false, true, NOW(), NOW()),
  ('customer-9', 'customer9@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri9', 'Soyad9', '+994 50 000 09', 'CUSTOMER', true, true, NOW(), NOW()),
  ('customer-10', 'customer10@example.com', '$2a$10$1Y..i5.p2aVd.1j.X.h/U.2A/S0Fh.8S.b/p.J.5s/3.Q.6w.9U.u', 'Müştəri10', 'Soyad10', '+994 50 000 10', 'CUSTOMER', false, true, NOW(), NOW());

INSERT INTO categories ("id", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('cat-engine', 'Dizel Mühərriklər', 'Forklift üçün dizel mühərrik və hissələri', true, NOW(), NOW()),
  ('cat-transmission', 'Transmissiya', 'Transmissiya və ötürücü hissələr', true, NOW(), NOW()),
  ('cat-hydraulic', 'Hidravlika', 'Hidravlik sistem və hissələr', true, NOW(), NOW()),
  ('cat-electrical', 'Elektrik', 'Elektrik və akkumulyator hissələri', true, NOW(), NOW()),
  ('cat-brakes', 'Əyləc Sistemi', 'Əyləc və təhlükəsizlik hissələri', true, NOW(), NOW());

INSERT INTO products ("id", "name", "description", "price", "sku", "stock", "categoryId", "isActive", "isFeatured", "createdAt", "updatedAt")
VALUES
  ('prod-1', 'Toyota Mühərrik porşeni', 'Toyota markalı mühərrik porşeni forklift üçün orijinal ehtiyat hissədir.', 12500, 'SKU-1001', 15, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-2', 'Komatsu Yağ filtri', 'Komatsu markalı yağ filtri forklift üçün orijinal ehtiyat hissədir.', 850, 'SKU-1002', 45, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-3', 'Nissan Hava filtri', 'Nissan markalı hava filtri forklift üçün orijinal ehtiyat hissədir.', 1200, 'SKU-1003', 32, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-4', 'Mitsubishi Yanacaq nasosu', 'Mitsubishi markalı yanacaq nasosu forklift üçün orijinal ehtiyat hissədir.', 3500, 'SKU-1004', 20, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-5', 'Hyundai Turbina', 'Hyundai markalı turbina forklift üçün orijinal ehtiyat hissədir.', 7800, 'SKU-1005', 10, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-6', 'Hyster Qaz paylayıcı kəmər', 'Hyster markalı qaz paylayıcı kəmər forklift üçün orijinal ehtiyat hissədir.', 2100, 'SKU-1006', 18, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-7', 'Caterpillar Vana', 'Caterpillar markalı vana forklift üçün orijinal ehtiyat hissədir.', 950, 'SKU-1007', 25, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-8', 'Clark Silindr başlığı', 'Clark markalı silindr başlığı forklift üçün orijinal ehtiyat hissədir.', 4300, 'SKU-1008', 12, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-9', 'Doosan Hidravlik silindr', 'Doosan markalı hidravlik silindr forklift üçün orijinal ehtiyat hissədir.', 6700, 'SKU-1009', 8, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-10', 'Jungheinrich Hidravlik nasos', 'Jungheinrich markalı hidravlik nasos forklift üçün orijinal ehtiyat hissədir.', 5400, 'SKU-1010', 14, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-11', 'Toyota Hidravlik şlanq', 'Toyota markalı hidravlik şlanq forklift üçün orijinal ehtiyat hissədir.', 600, 'SKU-1011', 30, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-12', 'Komatsu Hidravlik filtr', 'Komatsu markalı hidravlik filtr forklift üçün orijinal ehtiyat hissədir.', 900, 'SKU-1012', 22, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-13', 'Nissan Hidravlik çən', 'Nissan markalı hidravlik çən forklift üçün orijinal ehtiyat hissədir.', 3200, 'SKU-1013', 11, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-14', 'Mitsubishi Quru mufta', 'Mitsubishi markalı quru mufta forklift üçün orijinal ehtiyat hissədir.', 2100, 'SKU-1014', 16, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-15', 'Hyundai Yaş mufta', 'Hyundai markalı yaş mufta forklift üçün orijinal ehtiyat hissədir.', 2500, 'SKU-1015', 13, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-16', 'Hyster Kardan val', 'Hyster markalı kardan val forklift üçün orijinal ehtiyat hissədir.', 3700, 'SKU-1016', 9, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-17', 'Caterpillar Reduktor', 'Caterpillar markalı reduktor forklift üçün orijinal ehtiyat hissədir.', 4800, 'SKU-1017', 7, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-18', 'Clark Əsas dişli', 'Clark markalı əsas dişli forklift üçün orijinal ehtiyat hissədir.', 1600, 'SKU-1018', 21, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-19', 'Doosan Əyləc bəndi', 'Doosan markalı əyləc bəndi forklift üçün orijinal ehtiyat hissədir.', 700, 'SKU-1019', 28, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-20', 'Jungheinrich Əyləc diski', 'Jungheinrich markalı əyləc diski forklift üçün orijinal ehtiyat hissədir.', 1100, 'SKU-1020', 19, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-21', 'Toyota Əyləc silindri', 'Toyota markalı əyləc silindri forklift üçün orijinal ehtiyat hissədir.', 1300, 'SKU-1021', 17, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-22', 'Komatsu Əyləc mayesi', 'Komatsu markalı əyləc mayesi forklift üçün orijinal ehtiyat hissədir.', 400, 'SKU-1022', 40, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-23', 'Nissan Starter', 'Nissan markalı starter forklift üçün orijinal ehtiyat hissədir.', 3200, 'SKU-1023', 13, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-24', 'Mitsubishi Generator', 'Mitsubishi markalı generator forklift üçün orijinal ehtiyat hissədir.', 4100, 'SKU-1024', 11, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-25', 'Hyundai Akkumulyator', 'Hyundai markalı akkumulyator forklift üçün orijinal ehtiyat hissədir.', 2500, 'SKU-1025', 27, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-26', 'Hyster Fara', 'Hyster markalı fara forklift üçün orijinal ehtiyat hissədir.', 900, 'SKU-1026', 35, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-27', 'Caterpillar Dönmə işığı', 'Caterpillar markalı dönmə işığı forklift üçün orijinal ehtiyat hissədir.', 700, 'SKU-1027', 29, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-28', 'Clark Rul çarxı', 'Clark markalı rul çarxı forklift üçün orijinal ehtiyat hissədir.', 1800, 'SKU-1028', 16, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-29', 'Doosan Rul ucu', 'Doosan markalı rul ucu forklift üçün orijinal ehtiyat hissədir.', 950, 'SKU-1029', 23, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-30', 'Jungheinrich Rul mexanizmi', 'Jungheinrich markalı rul mexanizmi forklift üçün orijinal ehtiyat hissədir.', 2700, 'SKU-1030', 14, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-31', 'Toyota Amortizator', 'Toyota markalı amortizator forklift üçün orijinal ehtiyat hissədir.', 2100, 'SKU-1031', 18, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-32', 'Komatsu Yay', 'Komatsu markalı yay forklift üçün orijinal ehtiyat hissədir.', 1200, 'SKU-1032', 21, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-33', 'Nissan Qol', 'Nissan markalı qol forklift üçün orijinal ehtiyat hissədir.', 800, 'SKU-1033', 24, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-34', 'Mitsubishi Təkər', 'Mitsubishi markalı təkər forklift üçün orijinal ehtiyat hissədir.', 3500, 'SKU-1034', 10, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-35', 'Hyundai Şin', 'Hyundai markalı şin forklift üçün orijinal ehtiyat hissədir.', 2200, 'SKU-1035', 19, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-36', 'Hyster Kamera', 'Hyster markalı kamera forklift üçün orijinal ehtiyat hissədir.', 600, 'SKU-1036', 28, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-37', 'Caterpillar Kabin', 'Caterpillar markalı kabin forklift üçün orijinal ehtiyat hissədir.', 8000, 'SKU-1037', 6, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-38', 'Clark Qapı', 'Clark markalı qapı forklift üçün orijinal ehtiyat hissədir.', 4200, 'SKU-1038', 8, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-39', 'Doosan Şüşə', 'Doosan markalı şüşə forklift üçün orijinal ehtiyat hissədir.', 1700, 'SKU-1039', 15, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-40', 'Jungheinrich Standart çəngəl', 'Jungheinrich markalı standart çəngəl forklift üçün orijinal ehtiyat hissədir.', 2600, 'SKU-1040', 20, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-41', 'Toyota Uzun çəngəl', 'Toyota markalı uzun çəngəl forklift üçün orijinal ehtiyat hissədir.', 3200, 'SKU-1041', 13, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-42', 'Komatsu Baraban tutucu', 'Komatsu markalı baraban tutucu forklift üçün orijinal ehtiyat hissədir.', 1100, 'SKU-1042', 17, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-43', 'Nissan Mühərrik yağı', 'Nissan markalı mühərrik yağı forklift üçün orijinal ehtiyat hissədir.', 500, 'SKU-1043', 40, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-44', 'Mitsubishi Hidravlik yağ', 'Mitsubishi markalı hidravlik yağ forklift üçün orijinal ehtiyat hissədir.', 600, 'SKU-1044', 38, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-45', 'Hyundai Əyləc mayesi', 'Hyundai markalı əyləc mayesi forklift üçün orijinal ehtiyat hissədir.', 400, 'SKU-1045', 42, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-46', 'Hyster Soyuducu maye', 'Hyster markalı soyuducu maye forklift üçün orijinal ehtiyat hissədir.', 900, 'SKU-1046', 18, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-47', 'Caterpillar Porşen dəsti', 'Caterpillar markalı porşen dəsti forklift üçün orijinal ehtiyat hissədir.', 13500, 'SKU-1047', 7, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-48', 'Clark Qaz paylayıcı dəsti', 'Clark markalı qaz paylayıcı dəsti forklift üçün orijinal ehtiyat hissədir.', 3100, 'SKU-1048', 12, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-49', 'Doosan Hidravlik nasos dəsti', 'Doosan markalı hidravlik nasos dəsti forklift üçün orijinal ehtiyat hissədir.', 7400, 'SKU-1049', 9, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-50', 'Jungheinrich Əyləc diski dəsti', 'Jungheinrich markalı əyləc diski dəsti forklift üçün orijinal ehtiyat hissədir.', 2100, 'SKU-1050', 15, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-51', 'Toyota Quru mufta dəsti', 'Toyota markalı quru mufta dəsti forklift üçün orijinal ehtiyat hissədir.', 4200, 'SKU-1051', 11, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-52', 'Komatsu Yaş mufta dəsti', 'Komatsu markalı yaş mufta dəsti forklift üçün orijinal ehtiyat hissədir.', 4700, 'SKU-1052', 13, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-53', 'Nissan Kardan val dəsti', 'Nissan markalı kardan val dəsti forklift üçün orijinal ehtiyat hissədir.', 5900, 'SKU-1053', 8, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-54', 'Mitsubishi Reduktor dəsti', 'Mitsubishi markalı reduktor dəsti forklift üçün orijinal ehtiyat hissədir.', 6800, 'SKU-1054', 7, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-55', 'Hyundai Əsas dişli dəsti', 'Hyundai markalı əsas dişli dəsti forklift üçün orijinal ehtiyat hissədir.', 2600, 'SKU-1055', 19, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-56', 'Hyster Əyləc bəndi dəsti', 'Hyster markalı əyləc bəndi dəsti forklift üçün orijinal ehtiyat hissədir.', 1200, 'SKU-1056', 22, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-57', 'Caterpillar Əyləc diski dəsti', 'Caterpillar markalı əyləc diski dəsti forklift üçün orijinal ehtiyat hissədir.', 2300, 'SKU-1057', 17, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-58', 'Clark Əyləc silindri dəsti', 'Clark markalı əyləc silindri dəsti forklift üçün orijinal ehtiyat hissədir.', 1700, 'SKU-1058', 14, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-59', 'Doosan Əyləc mayesi dəsti', 'Doosan markalı əyləc mayesi dəsti forklift üçün orijinal ehtiyat hissədir.', 800, 'SKU-1059', 25, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-60', 'Jungheinrich Starter dəsti', 'Jungheinrich markalı starter dəsti forklift üçün orijinal ehtiyat hissədir.', 3700, 'SKU-1060', 10, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-61', 'Toyota Generator dəsti', 'Toyota markalı generator dəsti forklift üçün orijinal ehtiyat hissədir.', 5100, 'SKU-1061', 9, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-62', 'Komatsu Akkumulyator dəsti', 'Komatsu markalı akkumulyator dəsti forklift üçün orijinal ehtiyat hissədir.', 3200, 'SKU-1062', 18, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-63', 'Nissan Fara dəsti', 'Nissan markalı fara dəsti forklift üçün orijinal ehtiyat hissədir.', 1300, 'SKU-1063', 21, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-64', 'Mitsubishi Dönmə işığı dəsti', 'Mitsubishi markalı dönmə işığı dəsti forklift üçün orijinal ehtiyat hissədir.', 1100, 'SKU-1064', 16, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-65', 'Hyundai Rul çarxı dəsti', 'Hyundai markalı rul çarxı dəsti forklift üçün orijinal ehtiyat hissədir.', 2800, 'SKU-1065', 13, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-66', 'Hyster Rul ucu dəsti', 'Hyster markalı rul ucu dəsti forklift üçün orijinal ehtiyat hissədir.', 1200, 'SKU-1066', 19, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-67', 'Caterpillar Rul mexanizmi dəsti', 'Caterpillar markalı rul mexanizmi dəsti forklift üçün orijinal ehtiyat hissədir.', 3700, 'SKU-1067', 11, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-68', 'Clark Amortizator dəsti', 'Clark markalı amortizator dəsti forklift üçün orijinal ehtiyat hissədir.', 3100, 'SKU-1068', 15, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-69', 'Doosan Yay dəsti', 'Doosan markalı yay dəsti forklift üçün orijinal ehtiyat hissədir.', 1700, 'SKU-1069', 12, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-70', 'Jungheinrich Qol dəsti', 'Jungheinrich markalı qol dəsti forklift üçün orijinal ehtiyat hissədir.', 900, 'SKU-1070', 20, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-71', 'Toyota Təkər dəsti', 'Toyota markalı təkər dəsti forklift üçün orijinal ehtiyat hissədir.', 4500, 'SKU-1071', 8, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-72', 'Komatsu Şin dəsti', 'Komatsu markalı şin dəsti forklift üçün orijinal ehtiyat hissədir.', 3200, 'SKU-1072', 14, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-73', 'Nissan Kamera dəsti', 'Nissan markalı kamera dəsti forklift üçün orijinal ehtiyat hissədir.', 800, 'SKU-1073', 22, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-74', 'Mitsubishi Kabin dəsti', 'Mitsubishi markalı kabin dəsti forklift üçün orijinal ehtiyat hissədir.', 9000, 'SKU-1074', 7, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-75', 'Hyundai Qapı dəsti', 'Hyundai markalı qapı dəsti forklift üçün orijinal ehtiyat hissədir.', 5200, 'SKU-1075', 6, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-76', 'Hyster Şüşə dəsti', 'Hyster markalı şüşə dəsti forklift üçün orijinal ehtiyat hissədir.', 2100, 'SKU-1076', 9, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-77', 'Caterpillar Standart çəngəl dəsti', 'Caterpillar markalı standart çəngəl dəsti forklift üçün orijinal ehtiyat hissədir.', 3600, 'SKU-1077', 12, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-78', 'Clark Uzun çəngəl dəsti', 'Clark markalı uzun çəngəl dəsti forklift üçün orijinal ehtiyat hissədir.', 4200, 'SKU-1078', 10, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-79', 'Doosan Baraban tutucu dəsti', 'Doosan markalı baraban tutucu dəsti forklift üçün orijinal ehtiyat hissədir.', 1500, 'SKU-1079', 14, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-80', 'Jungheinrich Mühərrik yağı dəsti', 'Jungheinrich markalı mühərrik yağı dəsti forklift üçün orijinal ehtiyat hissədir.', 700, 'SKU-1080', 18, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-81', 'Toyota Hidravlik yağ dəsti', 'Toyota markalı hidravlik yağ dəsti forklift üçün orijinal ehtiyat hissədir.', 800, 'SKU-1081', 20, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-82', 'Komatsu Əyləc mayesi dəsti', 'Komatsu markalı əyləc mayesi dəsti forklift üçün orijinal ehtiyat hissədir.', 600, 'SKU-1082', 22, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-83', 'Nissan Soyuducu maye dəsti', 'Nissan markalı soyuducu maye dəsti forklift üçün orijinal ehtiyat hissədir.', 900, 'SKU-1083', 19, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-84', 'Mitsubishi Porşen dəsti', 'Mitsubishi markalı porşen dəsti forklift üçün orijinal ehtiyat hissədir.', 14500, 'SKU-1084', 8, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-85', 'Hyundai Qaz paylayıcı dəsti', 'Hyundai markalı qaz paylayıcı dəsti forklift üçün orijinal ehtiyat hissədir.', 3200, 'SKU-1085', 13, 'cat-engine', true, false, NOW(), NOW()),
  ('prod-86', 'Hyster Hidravlik nasos dəsti', 'Hyster markalı hidravlik nasos dəsti forklift üçün orijinal ehtiyat hissədir.', 7400, 'SKU-1086', 9, 'cat-hydraulic', true, false, NOW(), NOW()),
  ('prod-87', 'Caterpillar Əyləc diski dəsti', 'Caterpillar markalı əyləc diski dəsti forklift üçün orijinal ehtiyat hissədir.', 2100, 'SKU-1087', 15, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-88', 'Clark Quru mufta dəsti', 'Clark markalı quru mufta dəsti forklift üçün orijinal ehtiyat hissədir.', 4200, 'SKU-1088', 11, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-89', 'Doosan Yaş mufta dəsti', 'Doosan markalı yaş mufta dəsti forklift üçün orijinal ehtiyat hissədir.', 4700, 'SKU-1089', 13, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-90', 'Jungheinrich Kardan val dəsti', 'Jungheinrich markalı kardan val dəsti forklift üçün orijinal ehtiyat hissədir.', 5900, 'SKU-1090', 8, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-91', 'Toyota Reduktor dəsti', 'Toyota markalı reduktor dəsti forklift üçün orijinal ehtiyat hissədir.', 6800, 'SKU-1091', 7, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-92', 'Komatsu Əsas dişli dəsti', 'Komatsu markalı əsas dişli dəsti forklift üçün orijinal ehtiyat hissədir.', 2600, 'SKU-1092', 19, 'cat-transmission', true, false, NOW(), NOW()),
  ('prod-93', 'Nissan Əyləc bəndi dəsti', 'Nissan markalı əyləc bəndi dəsti forklift üçün orijinal ehtiyat hissədir.', 1200, 'SKU-1093', 22, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-94', 'Mitsubishi Əyləc diski dəsti', 'Mitsubishi markalı əyləc diski dəsti forklift üçün orijinal ehtiyat hissədir.', 2300, 'SKU-1094', 17, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-95', 'Hyundai Əyləc silindri dəsti', 'Hyundai markalı əyləc silindri dəsti forklift üçün orijinal ehtiyat hissədir.', 1700, 'SKU-1095', 14, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-96', 'Hyster Əyləc mayesi dəsti', 'Hyster markalı əyləc mayesi dəsti forklift üçün orijinal ehtiyat hissədir.', 800, 'SKU-1096', 25, 'cat-brakes', true, false, NOW(), NOW()),
  ('prod-97', 'Caterpillar Starter dəsti', 'Caterpillar markalı starter dəsti forklift üçün orijinal ehtiyat hissədir.', 3700, 'SKU-1097', 10, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-98', 'Clark Generator dəsti', 'Clark markalı generator dəsti forklift üçün orijinal ehtiyat hissədir.', 5100, 'SKU-1098', 9, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-99', 'Doosan Akkumulyator dəsti', 'Doosan markalı akkumulyator dəsti forklift üçün orijinal ehtiyat hissədir.', 3200, 'SKU-1099', 18, 'cat-electrical', true, false, NOW(), NOW()),
  ('prod-100', 'Jungheinrich Soyuducu maye', 'Jungheinrich markalı soyuducu maye forklift üçün orijinal ehtiyat hissədir.', 900, 'SKU-1100', 18, 'cat-hydraulic', true, false, NOW(), NOW());
