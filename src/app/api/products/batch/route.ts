import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) || [];
  console.log('Batch API called with IDs:', ids);
  if (!ids.length) return NextResponse.json([]);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const result = await client.query(`
      SELECT * FROM products 
      WHERE id = ANY($1::uuid[])
    `, [ids]);
    
    console.log('Batch API found products:', result.rows.length);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get batch products error:', error);
    return NextResponse.json([]);
  } finally {
    await client.end();
  }
} 