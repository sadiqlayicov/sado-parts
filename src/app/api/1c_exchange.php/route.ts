import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const mode = searchParams.get('mode');

  console.log('1C Exchange GET request:', { type, mode });

  // A. Начало сеанса (Session Start)
  if (type === 'catalog' && mode === 'checkauth') {
    console.log('1C Session start - checkauth');
    
    const response = `success
sessid
${Date.now()}`;

    return new NextResponse(response, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // B. Запрос параметров (Parameters Request)
  if (type === 'catalog' && mode === 'init') {
    console.log('1C Parameters request - init');
    
    const response = `zip=no
file_limit=1048576`;

    return new NextResponse(response, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Default response
  return new NextResponse('success', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const mode = searchParams.get('mode');
  const filename = searchParams.get('filename');

  console.log('1C Exchange POST request:', { type, mode, filename });

  // C. Выгрузка файлов (File Upload)
  if (type === 'catalog' && mode === 'file') {
    console.log('1C File upload:', filename);
    
    // For now, just return success
    return new NextResponse('success', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // D. Пошаговая загрузка данных (Step-by-step data import)
  if (type === 'catalog' && mode === 'import') {
    console.log('1C Data import:', filename);
    
    return new NextResponse('success', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Default response
  return new NextResponse('success', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

// Helper function to parse CommerceML XML and import products
async function importProductsFromCommerceML(xmlContent: string) {
  let client: any;
  
  try {
    client = await pool.connect();
    
    // Simple XML parsing (in production, use a proper XML parser)
    const products: any[] = [];
    
    // Extract products from XML using regex (simplified)
    const productMatches = xmlContent.match(/<Товар[^>]*>([\s\S]*?)<\/Товар>/g);
    
    if (productMatches) {
      for (const productMatch of productMatches) {
        const product: any = {};
        
        // Extract product ID
        const idMatch = productMatch.match(/<Ид>([^<]+)<\/Ид>/);
        if (idMatch) product.id = idMatch[1];
        
        // Extract product name
        const nameMatch = productMatch.match(/<Наименование>([^<]+)<\/Наименование>/);
        if (nameMatch) product.name = nameMatch[1];
        
        // Extract price
        const priceMatch = productMatch.match(/<ЦенаЗаЕдиницу>([^<]+)<\/ЦенаЗаЕдиницу>/);
        if (priceMatch) product.price = parseFloat(priceMatch[1]);
        
        // Extract description
        const descMatch = productMatch.match(/<Описание>([^<]+)<\/Описание>/);
        if (descMatch) product.description = descMatch[1];
        
        if (product.id && product.name) {
          products.push(product);
        }
      }
    }
    
    console.log(`Found ${products.length} products to import`);
    
    // Import products to database
    for (const product of products) {
      // Check if product already exists
      const existingProduct = await client.query(
        'SELECT id FROM products WHERE "1c_id" = $1',
        [product.id]
      );
      
      if (existingProduct.rows.length === 0) {
        // Insert new product
        await client.query(
          `INSERT INTO products (name, price, description, "1c_id", "categoryId", "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            product.name,
            product.price || 0,
            product.description || '',
            product.id,
            1, // Default category ID
            true
          ]
        );
        console.log(`Imported product: ${product.name}`);
      } else {
        // Update existing product
        await client.query(
          `UPDATE products 
           SET name = $1, price = $2, description = $3, "updatedAt" = NOW()
           WHERE "1c_id" = $4`,
          [
            product.name,
            product.price || 0,
            product.description || '',
            product.id
          ]
        );
        console.log(`Updated product: ${product.name}`);
      }
    }
    
    return { success: true, imported: products.length };
    
  } catch (error) {
    console.error('Error importing products:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
