// Database-ə məhsulları əlavə etmək üçün script
const products = [
  {
    name: "Fuel Filter",
    description: "High-quality fuel filter for optimal engine performance",
    price: 30,
    salePrice: 24,
    sku: "FUEL-FIL-010",
    stock: 50,
    artikul: "FF-010",
    categoryId: null
  },
  {
    name: "Hydraulic Hose",
    description: "Durable hydraulic hose for hydraulic systems",
    price: 75,
    salePrice: 60,
    sku: "HYD-HOSE-009",
    stock: 30,
    artikul: "HH-009",
    categoryId: null
  },
  {
    name: "Body Panel - Front Bumper",
    description: "Front bumper panel for vehicle body repair",
    price: 320,
    salePrice: 256,
    sku: "BODY-BUMP-008",
    stock: 15,
    artikul: "BP-008",
    categoryId: null
  },
  {
    name: "Tire Set (4 pieces)",
    description: "Complete tire set for vehicle wheels",
    price: 450,
    salePrice: 360,
    sku: "TIRE-SET-007",
    stock: 20,
    artikul: "TS-007",
    categoryId: null
  },
  {
    name: "Electrical Wiring Harness",
    description: "Electrical wiring harness for vehicle electrical systems",
    price: 180,
    salePrice: 144,
    sku: "WIRE-HARN-006",
    stock: 25,
    artikul: "EWH-006",
    categoryId: null
  }
];

async function addProducts() {
  for (const product of products) {
    try {
      const response = await fetch('https://sado-parts.vercel.app/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added product: ${product.name}`);
      } else {
        console.error(`❌ Failed to add product: ${product.name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding product ${product.name}:`, error);
    }
  }
}

addProducts(); 