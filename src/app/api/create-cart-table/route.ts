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
    
    console.log('🔧 cart_items cədvəlini yaradıram...');
    
    // Create cart_items table
    const createCartItemsTable = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await dbClient.query(createCartItemsTable);
    console.log('✅ cart_items cədvəli yaradıldı!');
    
    return NextResponse.json({
      success: true,
      message: 'cart_items cədvəli uğurla yaradıldı!'
    });

  } catch (error) {
    console.error('❌ cart_items yaratma xətası:', error);
    await closeClient();
    return NextResponse.json(
      { 
        error: 'cart_items cədvəlini yaratma zamanı xəta baş verdi',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const tableExists = await dbClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items'
      );
    `);
    
    return NextResponse.json({
      success: true,
      cartItemsTableExists: tableExists.rows[0].exists
    });

  } catch (error) {
    console.error('❌ cart_items yoxlama xətası:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'cart_items yoxlama zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 