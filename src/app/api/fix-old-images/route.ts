import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function POST() {
  try {
    console.log('Fixing old product images...');
    
    const client = await pool.connect();
    
    // Köhnə /uploads/ URL-ləri olan məhsulları tap
    const result = await client.query(`
      SELECT id, name, images 
      FROM products 
      WHERE images IS NOT NULL 
      AND images::text LIKE '%/uploads/%'
    `);
    
    console.log(`Found ${result.rows.length} products with old image URLs`);
    
    // Placeholder URL yarat
    const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9LPC90ZXh0Pjwvc3ZnPg==';
    
    let updatedCount = 0;
    
    for (const product of result.rows) {
      // Köhnə URL-ləri placeholder ilə əvəz et
      const newImages = [placeholderUrl];
      
      await client.query(`
        UPDATE products 
        SET images = $1 
        WHERE id = $2
      `, [newImages, product.id]);
      
      updatedCount++;
      console.log(`Updated product: ${product.name}`);
    }
    
    client.release();
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCount} products with old image URLs`,
      updatedCount
    });
    
  } catch (error: any) {
    console.error('Fix old images error:', error);
    return NextResponse.json({
      success: false,
      error: `Fix failed: ${error.message}`
    }, { status: 500 });
  }
}
