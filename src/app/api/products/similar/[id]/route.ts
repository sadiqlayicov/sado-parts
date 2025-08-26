import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool optimized for Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 3,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  let productId: string;
  
  try {
    const { id } = await params;
    productId = id;
    
    console.log('Similar products API called with product ID:', productId);
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // First, get the current product to find its category
    // Handle both UUID and custom ID formats
    let currentProductResult;
    try {
      currentProductResult = await client.query(`
        SELECT categoryId, name, artikul, "catalogNumber"
        FROM products 
        WHERE id = $1
      `, [productId]);
    } catch (queryError) {
      console.error('Error querying product with ID:', productId, queryError);
      // Try with text comparison if UUID fails
      currentProductResult = await client.query(`
        SELECT categoryId, name, artikul, "catalogNumber"
        FROM products 
        WHERE id::text = $1
      `, [productId]);
    }

    if (currentProductResult.rows.length === 0) {
      console.log('Product not found for ID:', productId);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const currentProduct = currentProductResult.rows[0];
    console.log('Current product found:', {
      id: productId,
      categoryId: currentProduct.categoryId,
      name: currentProduct.name,
      artikul: currentProduct.artikul
    });
    
    // If no category, return empty array
    if (!currentProduct.categoryId) {
      return NextResponse.json({
        success: true,
        products: []
      });
    }
    
    // Get similar products from the same category, excluding the current product
    let similarProductsResult;
    try {
      similarProductsResult = await client.query(`
        SELECT 
          p.id,
          p.name,
          p.price,
          p."salePrice",
          p.artikul,
          p."catalogNumber",
          p.stock,
          p."isActive",
          p.images,
          p."categoryId",
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE p."categoryId" = $1 
          AND p."isActive" = true 
          AND p.id::text != $2
        ORDER BY p."createdAt" DESC
        LIMIT 8
      `, [currentProduct.categoryId, productId]);
    } catch (similarQueryError) {
      console.error('Error querying similar products:', similarQueryError);
      // Try alternative approach if the first query fails
      similarProductsResult = await client.query(`
        SELECT 
          p.id,
          p.name,
          p.price,
          p."salePrice",
          p.artikul,
          p."catalogNumber",
          p.stock,
          p."isActive",
          p.images,
          p."categoryId",
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE p."categoryId" = $1 
          AND p."isActive" = true 
          AND p.id != $2
        ORDER BY p."createdAt" DESC
        LIMIT 8
      `, [currentProduct.categoryId, productId]);
    }

    const similarProducts = similarProductsResult.rows;
    console.log('Similar products found:', similarProducts.length);

    // If we have enough products from the same category, return them
    if (similarProducts.length >= 4) {
      return NextResponse.json({
        success: true,
        products: similarProducts
      });
    }

    // If we don't have enough products from the same category, get products with similar names or artikul
    const searchTerms = [
      currentProduct.name?.split(' ')[0], // First word of product name
      currentProduct.artikul?.substring(0, 4), // First 4 characters of artikul
      currentProduct.catalogNumber?.substring(0, 4) // First 4 characters of catalog number
    ].filter(Boolean);

    if (searchTerms.length > 0) {
      const searchTerm = searchTerms[0];
      const additionalProductsResult = await client.query(`
        SELECT 
          p.id,
          p.name,
          p.price,
          p."salePrice",
          p.artikul,
          p."catalogNumber",
          p.stock,
          p."isActive",
          p.images,
          p."categoryId",
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE (p.name ILIKE $1 OR p.artikul ILIKE $1 OR p."catalogNumber" ILIKE $1)
          AND p."isActive" = true 
          AND p.id::text != $2
          AND p."categoryId" != $3
        ORDER BY p."createdAt" DESC
        LIMIT $4
      `, [`%${searchTerm}%`, productId, currentProduct.categoryId, 8 - similarProducts.length]);

      const additionalProducts = additionalProductsResult.rows;
      
      if (additionalProducts.length > 0) {
        const combinedProducts = [...similarProducts, ...additionalProducts];
        // Remove duplicates based on ID
        const uniqueProducts = combinedProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );

        return NextResponse.json({
          success: true,
          products: uniqueProducts.slice(0, 8)
        });
      }
    }

    // Return whatever we have
    return NextResponse.json({
      success: true,
      products: similarProducts
    });

  } catch (error: any) {
    console.error('Get similar products error for product ID:', productId, error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      { error: 'Failed to fetch similar products', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
