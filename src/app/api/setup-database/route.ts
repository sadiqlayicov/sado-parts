import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Vercel üçün connection pool
let client: Client | null = null;

async function getClient() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
  }
  return client;
}

async function closeClient() {
  if (client) {
    await client.end();
    client = null;
  }
}

export async function POST(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    console.log('🔧 Database cədvəllərini yaradıram...');
    
    // Create cart_items table
    const createCartItemsTable = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("userId", "productId", "isActive")
      );
    `;
    
    await dbClient.query(createCartItemsTable);
    console.log('✅ cart_items cədvəli yaradıldı!');
    
    // Create orders table
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        "totalAmount" DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'AZN',
        notes TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await dbClient.query(createOrdersTable);
    console.log('✅ orders cədvəli yaradıldı!');
    
    // Create order_items table
    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await dbClient.query(createOrderItemsTable);
    console.log('✅ order_items cədvəli yaradıldı!');
    
    // Create addresses table
    const createAddressesTable = `
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        street TEXT NOT NULL,
        city VARCHAR(255) NOT NULL,
        state VARCHAR(255),
        "postalCode" VARCHAR(20),
        country VARCHAR(255) NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await dbClient.query(createAddressesTable);
    console.log('✅ addresses cədvəli yaradıldı!');
    
    // Check existing tables
    const tablesResult = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cart_items', 'orders', 'order_items', 'addresses')
      ORDER BY table_name
    `);
    
    const createdTables = tablesResult.rows.map((table: any) => table.table_name);
    
    return NextResponse.json({
      success: true,
      message: 'Database cədvəlləri uğurla yaradıldı!',
      createdTables,
      totalTables: createdTables.length
    });

  } catch (error) {
    console.error('❌ Database yaratma xətası:', error);
    await closeClient();
    return NextResponse.json(
      { 
        error: 'Database cədvəllərini yaratma zamanı xəta baş verdi',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to check existing tables
export async function GET() {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const tablesResult = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cart_items', 'orders', 'order_items', 'addresses')
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map((table: any) => table.table_name);
    
    return NextResponse.json({
      success: true,
      existingTables,
      totalTables: existingTables.length,
      requiredTables: ['cart_items', 'orders', 'order_items', 'addresses'],
      missingTables: ['cart_items', 'orders', 'order_items', 'addresses'].filter(
        table => !existingTables.includes(table)
      )
    });

  } catch (error) {
    console.error('❌ Database yoxlama xətası:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Database yoxlama zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 