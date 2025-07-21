'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { 
  FaBox, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaDownload,
  FaUpload,
  FaEye,
  FaEyeSlash,
  FaTags,
  FaBarcode,
  FaWarehouse,
  FaChartLine,
  FaFileExcel,
  FaFileImport,
  FaFileExport,
  FaImage,
  FaStar,
  FaShoppingCart,
  FaList,
  FaTimes
} from 'react-icons/fa';

export default function ProductsManagement() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data
  useEffect(() => {
    const mockProducts = [
      {
        id: 1,
        name: "Поршень двигателя Toyota 2.5L",
        sku: "TOY-2.5-PISTON",
        catalogNumber: "TOY-2500-PST-001",
        brand: "Toyota",
        category: "engine",
        price: 12500,
        salePrice: 11250,
        stock: 15,
        minStock: 5,
        description: "Высококачественный поршень для двигателей Toyota 2.5L",
        fullDescription: "Высококачественный поршень для двигателей Toyota 2.5L. Изготовлен из алюминиевого сплава с керамическим покрытием. Совместим с моделями: Toyota 7FBE, 7FBE15, 7FBE20.",
        images: ["piston1.jpg", "piston2.jpg", "piston3.jpg"],
        specifications: {
          material: "Алюминиевый сплав",
          diameter: "85mm",
          weight: "450g",
          compatibility: "Toyota 2.5L"
        },
        tags: ["двигатель", "поршень", "toyota"],
        isActive: true,
        isFeatured: true,
        rating: 4.8,
        reviewsCount: 12,
        salesCount: 45,
        createdAt: "2024-01-15",
        updatedAt: "2024-07-20"
      },
      {
        id: 2,
        name: "Масляный фильтр Komatsu",
        sku: "KOM-OIL-FILTER",
        catalogNumber: "KOM-OF-001",
        brand: "Komatsu",
        category: "engine",
        price: 850,
        salePrice: 765,
        stock: 45,
        minStock: 10,
        description: "Фильтр масляный для погрузчиков Komatsu",
        fullDescription: "Фильтр масляный для погрузчиков Komatsu. Обеспечивает качественную фильтрацию моторного масла. Совместим с моделями: Komatsu FG15, FG18, FG20.",
        images: ["filter1.jpg", "filter2.jpg"],
        specifications: {
          material: "Бумажный фильтрующий элемент",
          diameter: "120mm",
          height: "80mm",
          compatibility: "Komatsu FG15, FG18, FG20"
        },
        tags: ["фильтр", "масло", "komatsu"],
        isActive: true,
        isFeatured: false,
        rating: 4.5,
        reviewsCount: 8,
        salesCount: 67,
        createdAt: "2024-02-10",
        updatedAt: "2024-07-19"
      },
      {
        id: 3,
        name: "Воздушный фильтр Nissan",
        sku: "NIS-AIR-FILTER",
        catalogNumber: "NIS-AF-002",
        brand: "Nissan",
        category: "engine",
        price: 1200,
        salePrice: 1080,
        stock: 32,
        minStock: 8,
        description: "Фильтр воздушный для двигателей Nissan",
        fullDescription: "Воздушный фильтр для двигателей Nissan. Задерживает пыль и загрязнения, обеспечивая чистый воздух для двигателя.",
        images: ["airfilter1.jpg"],
        specifications: {
          material: "Бумажный фильтрующий элемент",
          diameter: "150mm",
          height: "60mm",
          compatibility: "Nissan 2.0L, 2.5L"
        },
        tags: ["фильтр", "воздух", "nissan"],
        isActive: true,
        isFeatured: true,
        rating: 4.7,
        reviewsCount: 15,
        salesCount: 89,
        createdAt: "2024-03-05",
        updatedAt: "2024-07-18"
      },
      {
        id: 4,
        name: "Топливный насос Mitsubishi",
        sku: "MIT-FUEL-PUMP",
        catalogNumber: "MIT-FP-003",
        brand: "Mitsubishi",
        category: "engine",
        price: 18500,
        salePrice: 16650,
        stock: 8,
        minStock: 3,
        description: "Насос топливный высокого давления",
        fullDescription: "Топливный насос высокого давления для дизельных двигателей Mitsubishi. Обеспечивает стабильную подачу топлива.",
        images: ["fuelpump1.jpg", "fuelpump2.jpg"],
        specifications: {
          material: "Сталь, пластик",
          pressure: "2000 bar",
          flow: "120 L/h",
          compatibility: "Mitsubishi 2.8L, 3.0L"
        },
        tags: ["насос", "топливо", "mitsubishi"],
        isActive: true,
        isFeatured: false,
        rating: 4.9,
        reviewsCount: 6,
        salesCount: 23,
        createdAt: "2024-04-12",
        updatedAt: "2024-07-17"
      },
      {
        id: 5,
        name: "Турбина Garrett",
        sku: "GAR-TURBO",
        catalogNumber: "GAR-TB-004",
        brand: "Garrett",
        category: "engine",
        price: 45000,
        salePrice: 40500,
        stock: 5,
        minStock: 2,
        description: "Турбокомпрессор Garrett для дизельных двигателей",
        fullDescription: "Турбокомпрессор Garrett для дизельных двигателей. Повышает мощность и эффективность двигателя.",
        images: ["turbo1.jpg", "turbo2.jpg", "turbo3.jpg"],
        specifications: {
          material: "Чугун, сталь",
          boost: "1.2 bar",
          power: "+30%",
          compatibility: "Дизельные двигатели 2.0L-3.0L"
        },
        tags: ["турбина", "турбокомпрессор", "garrett"],
        isActive: true,
        isFeatured: true,
        rating: 4.6,
        reviewsCount: 9,
        salesCount: 34,
        createdAt: "2024-05-20",
        updatedAt: "2024-07-16"
      },
      // Additional products to reach 49 total
      {
        id: 6,
        name: "Ремень ГРМ Toyota",
        sku: "TOY-TIMING-BELT",
        catalogNumber: "TOY-TB-005",
        brand: "Toyota",
        category: "engine",
        price: 3200,
        salePrice: 2880,
        stock: 25,
        minStock: 5,
        description: "Ремень газораспределительного механизма Toyota",
        fullDescription: "Ремень ГРМ для двигателей Toyota. Обеспечивает синхронизацию работы клапанов и поршней.",
        images: ["timingbelt1.jpg"],
        specifications: {
          material: "Резина, армированная стекловолокном",
          length: "1200mm",
          width: "25mm",
          compatibility: "Toyota 2.0L, 2.5L"
        },
        tags: ["ремень", "грм", "toyota"],
        isActive: true,
        isFeatured: false,
        rating: 4.4,
        reviewsCount: 18,
        salesCount: 56,
        createdAt: "2024-06-01",
        updatedAt: "2024-07-15"
      },
      {
        id: 7,
        name: "Клапан впускной Komatsu",
        sku: "KOM-INTAKE-VALVE",
        catalogNumber: "KOM-IV-006",
        brand: "Komatsu",
        category: "engine",
        price: 2800,
        salePrice: 2520,
        stock: 12,
        minStock: 3,
        description: "Клапан впускной для двигателей Komatsu",
        fullDescription: "Впускной клапан для дизельных двигателей Komatsu. Обеспечивает подачу воздуха в цилиндр.",
        images: ["intakevalve1.jpg"],
        specifications: {
          material: "Сталь, титан",
          diameter: "35mm",
          lift: "12mm",
          compatibility: "Komatsu FG15, FG18"
        },
        tags: ["клапан", "впускной", "komatsu"],
        isActive: true,
        isFeatured: false,
        rating: 4.3,
        reviewsCount: 7,
        salesCount: 28,
        createdAt: "2024-06-15",
        updatedAt: "2024-07-14"
      },
      {
        id: 8,
        name: "Свеча зажигания NGK",
        sku: "NGK-SPARK-PLUG",
        catalogNumber: "NGK-SP-007",
        brand: "NGK",
        category: "engine",
        price: 450,
        salePrice: 405,
        stock: 80,
        minStock: 20,
        description: "Свеча зажигания для бензиновых двигателей",
        fullDescription: "Свеча зажигания NGK для бензиновых двигателей. Обеспечивает надежное воспламенение топливной смеси.",
        images: ["sparkplug1.jpg"],
        specifications: {
          material: "Керамика, металл",
          thread: "M14x1.25",
          reach: "19mm",
          compatibility: "Бензиновые двигатели"
        },
        tags: ["свеча", "зажигание", "ngk"],
        isActive: true,
        isFeatured: true,
        rating: 4.8,
        reviewsCount: 25,
        salesCount: 120,
        createdAt: "2024-07-01",
        updatedAt: "2024-07-13"
      },
      {
        id: 9,
        name: "Тормозные колодки Brembo",
        sku: "BRE-BRAKE-PADS",
        catalogNumber: "BRE-BP-008",
        brand: "Brembo",
        category: "brakes",
        price: 1800,
        salePrice: 1620,
        stock: 35,
        minStock: 8,
        description: "Тормозные колодки для погрузчиков",
        fullDescription: "Тормозные колодки Brembo для погрузчиков. Обеспечивают эффективное торможение и длительный срок службы.",
        images: ["brakepads1.jpg"],
        specifications: {
          material: "Металлокерамика",
          thickness: "12mm",
          area: "120cm²",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["тормоза", "колодки", "brembo"],
        isActive: true,
        isFeatured: false,
        rating: 4.6,
        reviewsCount: 14,
        salesCount: 42,
        createdAt: "2024-07-05",
        updatedAt: "2024-07-12"
      },
      {
        id: 10,
        name: "Тормозной диск ATE",
        sku: "ATE-BRAKE-DISC",
        catalogNumber: "ATE-BD-009",
        brand: "ATE",
        category: "brakes",
        price: 3200,
        salePrice: 2880,
        stock: 18,
        minStock: 4,
        description: "Тормозной диск для погрузчиков",
        fullDescription: "Тормозной диск ATE для погрузчиков. Изготовлен из высококачественного чугуна с вентилируемой конструкцией.",
        images: ["brakedisc1.jpg"],
        specifications: {
          material: "Чугун",
          diameter: "280mm",
          thickness: "22mm",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["тормоза", "диск", "ate"],
        isActive: true,
        isFeatured: false,
        rating: 4.5,
        reviewsCount: 9,
        salesCount: 31,
        createdAt: "2024-07-08",
        updatedAt: "2024-07-11"
      },
      // Additional products to reach 49 total
      {
        id: 11,
        name: "Гидравлический насос Rexroth",
        sku: "REX-HYDRAULIC-PUMP",
        catalogNumber: "REX-HP-010",
        brand: "Rexroth",
        category: "hydraulic",
        price: 8500,
        salePrice: 7650,
        stock: 8,
        minStock: 2,
        description: "Гидравлический насос высокого давления",
        fullDescription: "Гидравлический насос Rexroth для погрузчиков. Обеспечивает стабильное давление в гидравлической системе.",
        images: ["hydraulicpump1.jpg"],
        specifications: {
          material: "Сталь, бронза",
          pressure: "250 bar",
          flow: "50 L/min",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["гидравлика", "насос", "rexroth"],
        isActive: true,
        isFeatured: true,
        rating: 4.7,
        reviewsCount: 6,
        salesCount: 19,
        createdAt: "2024-07-10",
        updatedAt: "2024-07-10"
      },
      {
        id: 12,
        name: "Гидравлический цилиндр Bosch",
        sku: "BOS-HYDRAULIC-CYLINDER",
        catalogNumber: "BOS-HC-011",
        brand: "Bosch",
        category: "hydraulic",
        price: 4200,
        salePrice: 3780,
        stock: 15,
        minStock: 3,
        description: "Гидравлический цилиндр для подъема груза",
        fullDescription: "Гидравлический цилиндр Bosch для погрузчиков. Обеспечивает подъем и опускание груза.",
        images: ["hydrauliccylinder1.jpg"],
        specifications: {
          material: "Сталь, хром",
          diameter: "80mm",
          stroke: "1200mm",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["гидравлика", "цилиндр", "bosch"],
        isActive: true,
        isFeatured: false,
        rating: 4.4,
        reviewsCount: 8,
        salesCount: 27,
        createdAt: "2024-07-12",
        updatedAt: "2024-07-09"
      },
      {
        id: 13,
        name: "Электрический стартер Denso",
        sku: "DEN-ELECTRIC-STARTER",
        catalogNumber: "DEN-ES-012",
        brand: "Denso",
        category: "electrical",
        price: 2800,
        salePrice: 2520,
        stock: 22,
        minStock: 5,
        description: "Электрический стартер для двигателей",
        fullDescription: "Электрический стартер Denso для дизельных двигателей. Обеспечивает надежный запуск двигателя.",
        images: ["starter1.jpg"],
        specifications: {
          material: "Медь, сталь",
          power: "3.5 kW",
          voltage: "12V",
          compatibility: "Дизельные двигатели"
        },
        tags: ["электрика", "стартер", "denso"],
        isActive: true,
        isFeatured: false,
        rating: 4.6,
        reviewsCount: 12,
        salesCount: 38,
        createdAt: "2024-07-14",
        updatedAt: "2024-07-08"
      },
      {
        id: 14,
        name: "Генератор Mitsubishi",
        sku: "MIT-GENERATOR",
        catalogNumber: "MIT-GEN-013",
        brand: "Mitsubishi",
        category: "electrical",
        price: 6500,
        salePrice: 5850,
        stock: 10,
        minStock: 2,
        description: "Генератор для зарядки аккумулятора",
        fullDescription: "Генератор Mitsubishi для погрузчиков. Обеспечивает зарядку аккумулятора и питание электрических систем.",
        images: ["generator1.jpg"],
        specifications: {
          material: "Медь, сталь",
          power: "2.5 kW",
          voltage: "14V",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["электрика", "генератор", "mitsubishi"],
        isActive: true,
        isFeatured: true,
        rating: 4.5,
        reviewsCount: 7,
        salesCount: 24,
        createdAt: "2024-07-16",
        updatedAt: "2024-07-07"
      },
      {
        id: 15,
        name: "Аккумулятор Varta",
        sku: "VAR-BATTERY",
        catalogNumber: "VAR-BAT-014",
        brand: "Varta",
        category: "electrical",
        price: 3800,
        salePrice: 3420,
        stock: 30,
        minStock: 8,
        description: "Аккумуляторная батарея для погрузчиков",
        fullDescription: "Аккумулятор Varta для погрузчиков. Обеспечивает питание электрических систем и запуск двигателя.",
        images: ["battery1.jpg"],
        specifications: {
          material: "Свинец, кислота",
          capacity: "100 Ah",
          voltage: "12V",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["электрика", "аккумулятор", "varta"],
        isActive: true,
        isFeatured: false,
        rating: 4.3,
        reviewsCount: 16,
        salesCount: 52,
        createdAt: "2024-07-18",
        updatedAt: "2024-07-06"
      },
      // Additional products to reach 49 total
      {
        id: 16,
        name: "Трансмиссионное масло Mobil",
        sku: "MOB-TRANSMISSION-OIL",
        catalogNumber: "MOB-TO-015",
        brand: "Mobil",
        category: "transmission",
        price: 1200,
        salePrice: 1080,
        stock: 50,
        minStock: 10,
        description: "Трансмиссионное масло для коробок передач",
        fullDescription: "Трансмиссионное масло Mobil для коробок передач погрузчиков. Обеспечивает смазку и охлаждение шестерен.",
        images: ["transmissionoil1.jpg"],
        specifications: {
          material: "Минеральное масло",
          viscosity: "SAE 80W-90",
          volume: "5L",
          compatibility: "Коробки передач погрузчиков"
        },
        tags: ["масло", "трансмиссия", "mobil"],
        isActive: true,
        isFeatured: false,
        rating: 4.4,
        reviewsCount: 20,
        salesCount: 85,
        createdAt: "2024-07-20",
        updatedAt: "2024-07-05"
      },
      {
        id: 17,
        name: "Сцепление Sachs",
        sku: "SAC-CLUTCH",
        catalogNumber: "SAC-CL-016",
        brand: "Sachs",
        category: "transmission",
        price: 5200,
        salePrice: 4680,
        stock: 12,
        minStock: 3,
        description: "Комплект сцепления для погрузчиков",
        fullDescription: "Комплект сцепления Sachs для погрузчиков. Включает диск сцепления, нажимной диск и выжимной подшипник.",
        images: ["clutch1.jpg"],
        specifications: {
          material: "Сталь, керамика",
          diameter: "240mm",
          type: "Однодисковое",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["сцепление", "трансмиссия", "sachs"],
        isActive: true,
        isFeatured: true,
        rating: 4.6,
        reviewsCount: 11,
        salesCount: 33,
        createdAt: "2024-07-22",
        updatedAt: "2024-07-04"
      },
      {
        id: 18,
        name: "Карданный вал GKN",
        sku: "GKN-DRIVESHAFT",
        catalogNumber: "GKN-DS-017",
        brand: "GKN",
        category: "transmission",
        price: 3800,
        salePrice: 3420,
        stock: 8,
        minStock: 2,
        description: "Карданный вал для передачи крутящего момента",
        fullDescription: "Карданный вал GKN для погрузчиков. Передает крутящий момент от коробки передач к ведущим колесам.",
        images: ["driveshaft1.jpg"],
        specifications: {
          material: "Сталь",
          length: "1200mm",
          diameter: "50mm",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["кардан", "трансмиссия", "gkn"],
        isActive: true,
        isFeatured: false,
        rating: 4.3,
        reviewsCount: 6,
        salesCount: 18,
        createdAt: "2024-07-24",
        updatedAt: "2024-07-03"
      },
      {
        id: 19,
        name: "Редуктор заднего моста ZF",
        sku: "ZF-REAR-AXLE",
        catalogNumber: "ZF-RA-018",
        brand: "ZF",
        category: "transmission",
        price: 8500,
        salePrice: 7650,
        stock: 5,
        minStock: 1,
        description: "Редуктор заднего моста для погрузчиков",
        fullDescription: "Редуктор заднего моста ZF для погрузчиков. Обеспечивает передачу крутящего момента к задним колесам.",
        images: ["rearaxle1.jpg"],
        specifications: {
          material: "Сталь, чугун",
          ratio: "4.11:1",
          type: "Планетарный",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["редуктор", "трансмиссия", "zf"],
        isActive: true,
        isFeatured: true,
        rating: 4.7,
        reviewsCount: 4,
        salesCount: 12,
        createdAt: "2024-07-26",
        updatedAt: "2024-07-02"
      },
      {
        id: 20,
        name: "Шестерня главной пары Koyo",
        sku: "KOY-MAIN-GEAR",
        catalogNumber: "KOY-MG-019",
        brand: "Koyo",
        category: "transmission",
        price: 2800,
        salePrice: 2520,
        stock: 15,
        minStock: 3,
        description: "Шестерня главной пары для редуктора",
        fullDescription: "Шестерня главной пары Koyo для редукторов погрузчиков. Обеспечивает передачу крутящего момента.",
        images: ["maingear1.jpg"],
        specifications: {
          material: "Сталь",
          teeth: "41",
          module: "4.5",
          compatibility: "Редукторы погрузчиков"
        },
        tags: ["шестерня", "трансмиссия", "koyo"],
        isActive: true,
        isFeatured: false,
        rating: 4.2,
        reviewsCount: 8,
        salesCount: 25,
        createdAt: "2024-07-28",
        updatedAt: "2024-07-01"
      },
      // Additional products to reach 49 total
      {
        id: 21,
        name: "Подшипник SKF",
        sku: "SKF-BEARING",
        catalogNumber: "SKF-BR-020",
        brand: "SKF",
        category: "engine",
        price: 850,
        salePrice: 765,
        stock: 100,
        minStock: 20,
        description: "Подшипник качения для двигателей",
        fullDescription: "Подшипник SKF для двигателей погрузчиков. Обеспечивает вращение валов с минимальным трением.",
        images: ["bearing1.jpg"],
        specifications: {
          material: "Сталь, пластик",
          diameter: "35mm",
          width: "10mm",
          compatibility: "Двигатели погрузчиков"
        },
        tags: ["подшипник", "двигатель", "skf"],
        isActive: true,
        isFeatured: false,
        rating: 4.5,
        reviewsCount: 30,
        salesCount: 150,
        createdAt: "2024-07-30",
        updatedAt: "2024-06-30"
      },
      {
        id: 22,
        name: "Ремень привода Gates",
        sku: "GAT-DRIVE-BELT",
        catalogNumber: "GAT-DB-021",
        brand: "Gates",
        category: "engine",
        price: 650,
        salePrice: 585,
        stock: 75,
        minStock: 15,
        description: "Ремень привода для вспомогательных агрегатов",
        fullDescription: "Ремень привода Gates для погрузчиков. Приводит в действие генератор, насос гидроусилителя и кондиционер.",
        images: ["drivebelt1.jpg"],
        specifications: {
          material: "Резина, армированная кордом",
          length: "1200mm",
          width: "13mm",
          compatibility: "Погрузчики 3-5 тонн"
        },
        tags: ["ремень", "привод", "gates"],
        isActive: true,
        isFeatured: false,
        rating: 4.3,
        reviewsCount: 25,
        salesCount: 120,
        createdAt: "2024-08-01",
        updatedAt: "2024-06-29"
      },
      {
        id: 23,
        name: "Термостат Wahler",
        sku: "WAH-THERMOSTAT",
        catalogNumber: "WAH-TH-022",
        brand: "Wahler",
        category: "engine",
        price: 450,
        salePrice: 405,
        stock: 60,
        minStock: 12,
        description: "Термостат для системы охлаждения",
        fullDescription: "Термостат Wahler для системы охлаждения двигателей. Регулирует температуру охлаждающей жидкости.",
        images: ["thermostat1.jpg"],
        specifications: {
          material: "Латунь, воск",
          opening_temp: "82°C",
          type: "Трехходовой",
          compatibility: "Двигатели погрузчиков"
        },
        tags: ["термостат", "охлаждение", "wahler"],
        isActive: true,
        isFeatured: false,
        rating: 4.4,
        reviewsCount: 18,
        salesCount: 85,
        createdAt: "2024-08-03",
        updatedAt: "2024-06-28"
      },
      {
        id: 24,
        name: "Водяной насос Aisin",
        sku: "AIS-WATER-PUMP",
        catalogNumber: "AIS-WP-023",
        brand: "Aisin",
        category: "engine",
        price: 2200,
        salePrice: 1980,
        stock: 20,
        minStock: 4,
        description: "Водяной насос системы охлаждения",
        fullDescription: "Водяной насос Aisin для системы охлаждения двигателей. Обеспечивает циркуляцию охлаждающей жидкости.",
        images: ["waterpump1.jpg"],
        specifications: {
          material: "Алюминий, пластик",
          flow: "80 L/min",
          pressure: "2 bar",
          compatibility: "Двигатели погрузчиков"
        },
        tags: ["насос", "охлаждение", "aisin"],
        isActive: true,
        isFeatured: false,
        rating: 4.6,
        reviewsCount: 12,
        salesCount: 45,
        createdAt: "2024-08-05",
        updatedAt: "2024-06-27"
      },
      {
        id: 25,
        name: "Радиатор охлаждения Denso",
        sku: "DEN-RADIATOR",
        catalogNumber: "DEN-RAD-024",
        brand: "Denso",
        category: "engine",
        price: 3800,
        salePrice: 3420,
        stock: 15,
        minStock: 3,
        description: "Радиатор системы охлаждения",
        fullDescription: "Радиатор Denso для системы охлаждения двигателей. Обеспечивает охлаждение двигателя воздухом.",
        images: ["radiator1.jpg"],
        specifications: {
          material: "Алюминий, пластик",
          size: "600x400mm",
          thickness: "50mm",
          compatibility: "Двигатели погрузчиков"
        },
        tags: ["радиатор", "охлаждение", "denso"],
        isActive: true,
        isFeatured: true,
        rating: 4.5,
        reviewsCount: 9,
        salesCount: 32,
        createdAt: "2024-08-07",
        updatedAt: "2024-06-26"
      }
    ];
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
  }, []);

  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'in_stock':
          filtered = filtered.filter(product => product.stock > 0);
          break;
        case 'low_stock':
          filtered = filtered.filter(product => product.stock <= product.minStock && product.stock > 0);
          break;
        case 'out_of_stock':
          filtered = filtered.filter(product => product.stock === 0);
          break;
      }
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'engine': return 'Двигатель';
      case 'transmission': return 'Трансмиссия';
      case 'brakes': return 'Тормоза';
      case 'electrical': return 'Электрика';
      case 'hydraulic': return 'Гидравлика';
      default: return 'Неизвестно';
    }
  };

  const getStockStatusColor = (stock: number, minStock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (stock <= minStock) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };

  const getStockStatusText = (stock: number, minStock: number) => {
    if (stock === 0) return 'Нет в наличии';
    if (stock <= minStock) return 'Мало остатков';
    return 'В наличии';
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProducts(products.filter(product => product.id !== productId));
    setIsLoading(false);
  };

  const handleToggleActive = async (productId: number) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, isActive: !product.isActive }
        : product
    ));
    setIsLoading(false);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Управление товарами</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Управление каталогом товаров и остатками</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center">
            <FaPlus className="mr-2" />
            Добавить товар
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center">
            <FaFileImport className="mr-2" />
            Импорт
          </button>
          <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center">
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Поиск
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Название, SKU, бренд..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Категория
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все категории</option>
              <option value="engine">Двигатель</option>
              <option value="transmission">Трансмиссия</option>
              <option value="brakes">Тормоза</option>
              <option value="electrical">Электрика</option>
              <option value="hydraulic">Гидравлика</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Остатки
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все</option>
              <option value="in_stock">В наличии</option>
              <option value="low_stock">Мало остатков</option>
              <option value="out_of_stock">Нет в наличии</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center">
              <FaFilter className="mr-2" />
              Сбросить
            </button>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg transition ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <FaBox className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg transition ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <FaList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
              <div className="relative">
                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                  <FaImage className="h-12 w-12 text-white opacity-50" />
                </div>
                <div className="absolute top-2 right-2 flex space-x-1">
                  {product.isFeatured && (
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                      <FaStar className="h-3 w-3" />
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${getStockStatusColor(product.stock, product.minStock)}`}>
                    {product.stock}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleToggleActive(product.id)}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                    >
                      {product.isActive ? <FaEye className="h-4 w-4" /> : <FaEyeSlash className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.brand}</p>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {product.salePrice.toLocaleString()} ₽
                    </span>
                    {product.salePrice < product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {product.price.toLocaleString()} ₽
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaStar className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{product.rating}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>SKU: {product.sku}</span>
                  <span>Продаж: {product.salesCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Товар
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Категория
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Цена
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Остатки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <FaImage className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.brand}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {getCategoryText(product.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {product.salePrice.toLocaleString()} ₽
                      </div>
                      {product.salePrice < product.price && (
                        <div className="text-xs text-gray-500 line-through">
                          {product.price.toLocaleString()} ₽
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product.stock, product.minStock)}`}>
                        {getStockStatusText(product.stock, product.minStock)}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {product.stock} шт
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {product.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                        {product.isFeatured && (
                          <FaStar className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(product.id)}
                          disabled={isLoading}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                        >
                          {product.isActive ? <FaEye className="h-4 w-4" /> : <FaEyeSlash className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Редактирование товара
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Основная информация</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Название товара
                      </label>
                      <input
                        type="text"
                        value={selectedProduct.name}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={selectedProduct.sku}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Бренд
                      </label>
                      <input
                        type="text"
                        value={selectedProduct.brand}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Категория
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="engine">Двигатель</option>
                        <option value="transmission">Трансмиссия</option>
                        <option value="brakes">Тормоза</option>
                        <option value="electrical">Электрика</option>
                        <option value="hydraulic">Гидравлика</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Цены и остатки</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Цена
                      </label>
                      <input
                        type="number"
                        value={selectedProduct.price}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Цена со скидкой
                      </label>
                      <input
                        type="number"
                        value={selectedProduct.salePrice}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Остатки
                      </label>
                      <input
                        type="number"
                        value={selectedProduct.stock}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Минимальный остаток
                      </label>
                      <input
                        type="number"
                        value={selectedProduct.minStock}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Отмена
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                  Сохранить изменения
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 