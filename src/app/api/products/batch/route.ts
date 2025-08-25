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
    
    // Accept both UUID format and Supabase custom ID format
    const validIds = ids.filter(id => {
      // UUID format: 8-4-4-4-12
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // Supabase custom ID format: 25 characters
      const customIdRegex = /^[a-z0-9]{25}$/i;
      return uuidRegex.test(id) || customIdRegex.test(id);
    });
    
    console.log('Valid UUIDs:', validIds);
    
    if (validIds.length === 0) {
      console.log('No valid UUIDs found');
      return NextResponse.json([]);
    }

    // First, let's check if these IDs exist in the database at all
    const checkResult = await client.query(`
      SELECT id, name FROM products 
      WHERE id = ANY($1)
    `, [validIds]);
    
    console.log('Products found in database:', checkResult.rows);
    console.log('Product IDs in database:', checkResult.rows.map(row => row.id));
    
    // Now get full product details - include inactive products for wishlist
    const result = await client.query(`
      SELECT * FROM products 
      WHERE id = ANY($1)
    `, [validIds]);
    
    console.log('Batch API found products:', result.rows.length);
    console.log('Product names found:', result.rows.map(row => row.name));
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get batch products error:', error);
    return NextResponse.json([]);
  } finally {
    await client.end();
  }
} 