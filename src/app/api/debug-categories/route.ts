import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
})

export async function GET(request: NextRequest) {
  let client;
  
  try {
    console.log('GET /api/debug-categories called');
    
    client = await pool.connect();
    console.log('Database connected successfully');

    // Get all categories with their structure
    const categoriesResult = await client.query(`
      SELECT 
        id,
        name,
        "parentId",
        "isActive",
        "createdAt"
      FROM categories 
      WHERE "isActive" = true 
      ORDER BY name ASC
    `);

    const categories = categoriesResult.rows;
    console.log('All categories:', categories);

    // Get products count by category
    const productsByCategoryResult = await client.query(`
      SELECT 
        p."categoryId",
        c.name as category_name,
        COUNT(*) as product_count
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."isActive" = true
      GROUP BY p."categoryId", c.name
      ORDER BY c.name ASC
    `);

    const productsByCategory = productsByCategoryResult.rows;
    console.log('Products by category:', productsByCategory);

    // Find Hidravlika category specifically
    const hidravlikaResult = await client.query(`
      SELECT id, name, "parentId" FROM categories 
      WHERE name ILIKE '%hidravlika%' AND "isActive" = true
    `);

    const hidravlikaCategory = hidravlikaResult.rows[0];
    console.log('Hidravlika category:', hidravlikaCategory);

    if (hidravlikaCategory) {
      // Get subcategories of Hidravlika
      const subcategoriesResult = await client.query(`
        SELECT id, name, "parentId" FROM categories 
        WHERE "parentId" = $1 AND "isActive" = true
      `, [hidravlikaCategory.id]);

      const subcategories = subcategoriesResult.rows;
      console.log('Hidravlika subcategories:', subcategories);

      // Get products in Hidravlika and its subcategories
      const hidravlikaProductsResult = await client.query(`
        SELECT 
          p.id,
          p.name,
          p."categoryId",
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE p."isActive" = true 
        AND (
          p."categoryId" = $1 
          OR p."categoryId" IN (
            SELECT id FROM categories 
            WHERE "parentId" = $1 AND "isActive" = true
          )
        )
        ORDER BY c.name, p.name
      `, [hidravlikaCategory.id]);

      const hidravlikaProducts = hidravlikaProductsResult.rows;
      console.log('Hidravlika products:', hidravlikaProducts);

      return NextResponse.json({
        success: true,
        data: {
          allCategories: categories,
          productsByCategory: productsByCategory,
          hidravlikaCategory: hidravlikaCategory,
          hidravlikaSubcategories: subcategories,
          hidravlikaProducts: hidravlikaProducts,
          totalHidravlikaProducts: hidravlikaProducts.length
        },
        message: `Debug info: ${categories.length} categories, ${hidravlikaProducts.length} Hidravlika products`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Hidravlika category not found',
        data: {
          allCategories: categories,
          productsByCategory: productsByCategory
        }
      });
    }
    
  } catch (error: any) {
    console.error('Database error in GET /api/debug-categories:', error);
    return NextResponse.json(
      { success: false, error: `Database xətası: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
