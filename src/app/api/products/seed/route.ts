import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const products = [
  {
    name: "Fuel Filter",
    description: "High-quality fuel filter for optimal engine performance",
    price: 30,
    salePrice: 24,
    sku: "FUEL-FIL-010",
    stock: 50,
    artikul: "FF-010"
  },
  {
    name: "Hydraulic Hose",
    description: "Durable hydraulic hose for hydraulic systems",
    price: 75,
    salePrice: 60,
    sku: "HYD-HOSE-009",
    stock: 30,
    artikul: "HH-009"
  },
  {
    name: "Body Panel - Front Bumper",
    description: "Front bumper panel for vehicle body repair",
    price: 320,
    salePrice: 256,
    sku: "BODY-BUMP-008",
    stock: 15,
    artikul: "BP-008"
  },
  {
    name: "Tire Set (4 pieces)",
    description: "Complete tire set for vehicle wheels",
    price: 450,
    salePrice: 360,
    sku: "TIRE-SET-007",
    stock: 20,
    artikul: "TS-007"
  },
  {
    name: "Electrical Wiring Harness",
    description: "Electrical wiring harness for vehicle electrical systems",
    price: 180,
    salePrice: 144,
    sku: "WIRE-HARN-006",
    stock: 25,
    artikul: "EWH-006"
  }
];

export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('✅ Database connected for seeding');

    const addedProducts = [];

    for (const product of products) {
      try {
        const result = await client.query(`
          INSERT INTO products (
            id, name, description, price, "salePrice", sku, stock, 
            artikul, "isActive", "isFeatured", "createdAt", "updatedAt"
          ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [
          product.name,
          product.description,
          product.price,
          product.salePrice,
          product.sku,
          product.stock,
          product.artikul,
          true, // isActive
          false, // isFeatured
          new Date().toISOString(),
          new Date().toISOString()
        ]);

        addedProducts.push(result.rows[0]);
        console.log(`✅ Added product: ${product.name}`);
      } catch (error) {
        console.error(`❌ Error adding product ${product.name}:`, error);
      }
    }

    return NextResponse.json({
      message: `Successfully added ${addedProducts.length} products`,
      products: addedProducts
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed products' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
} 