const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkProductsAndCategories() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully');

    // Check if tables exist
    console.log('\n=== CHECKING TABLE EXISTENCE ===');
    
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'categories')
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:', tablesCheck.rows.map(row => row.table_name));

    // Check categories table structure
    console.log('\n=== CATEGORIES TABLE STRUCTURE ===');
    try {
      const categoriesColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'categories'
        ORDER BY ordinal_position;
      `);
      
      console.log('Categories table columns:');
      categoriesColumns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (error) {
      console.log('Categories table does not exist or error:', error.message);
    }

    // Check products table structure
    console.log('\n=== PRODUCTS TABLE STRUCTURE ===');
    try {
      const productsColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'products'
        ORDER BY ordinal_position;
      `);
      
      console.log('Products table columns:');
      productsColumns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (error) {
      console.log('Products table does not exist or error:', error.message);
    }

    // Check categories data
    console.log('\n=== CATEGORIES DATA ===');
    try {
      const categoriesCount = await client.query('SELECT COUNT(*) FROM categories');
      console.log(`Total categories: ${categoriesCount.rows[0].count}`);
      
      const categoriesData = await client.query(`
        SELECT id, name, "parentId", "isActive", "createdAt"
        FROM categories 
        ORDER BY name;
      `);
      
      console.log('\nCategories list:');
      categoriesData.rows.forEach(cat => {
        console.log(`  ${cat.id}: ${cat.name} (parent: ${cat.parentId || 'none'}, active: ${cat.isActive})`);
      });
    } catch (error) {
      console.log('Error reading categories:', error.message);
    }

    // Check products data
    console.log('\n=== PRODUCTS DATA ===');
    try {
      const productsCount = await client.query('SELECT COUNT(*) FROM products');
      console.log(`Total products: ${productsCount.rows[0].count}`);
      
      const productsData = await client.query(`
        SELECT p.id, p.name, p."categoryId", c.name as category_name, p."isActive"
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        ORDER BY p.name
        LIMIT 10;
      `);
      
      console.log('\nSample products:');
      productsData.rows.forEach(product => {
        console.log(`  ${product.id}: ${product.name} (category: ${product.category_name || product.categoryId}, active: ${product.isActive})`);
      });
    } catch (error) {
      console.log('Error reading products:', error.message);
    }

    // Test the category filtering query
    console.log('\n=== TESTING CATEGORY FILTERING ===');
    try {
      // Get a sample category
      const sampleCategory = await client.query('SELECT id, name FROM categories WHERE "isActive" = true LIMIT 1');
      
      if (sampleCategory.rows.length > 0) {
        const categoryId = sampleCategory.rows[0].id;
        const categoryName = sampleCategory.rows[0].name;
        
        console.log(`Testing with category: ${categoryName} (${categoryId})`);
        
        // Get subcategories
        const subcategoriesQuery = 'SELECT id FROM categories WHERE "parentId" = $1 AND "isActive" = true';
        const subcategoriesResult = await client.query(subcategoriesQuery, [categoryId]);
        const subcategoryIds = subcategoriesResult.rows.map(row => row.id);
        
        console.log(`Found ${subcategoryIds.length} subcategories:`, subcategoryIds);
        
        // Test the products query
        let query = `
          SELECT COUNT(*) as count
          FROM products p
          LEFT JOIN categories c ON p."categoryId" = c.id
          WHERE p."isActive" = true
        `;
        
        const queryParams = [];
        
        if (subcategoryIds.length === 0) {
          query += ` AND p."categoryId" = $1`;
          queryParams.push(categoryId);
        } else {
          const allCategoryIds = [categoryId, ...subcategoryIds];
          const placeholders = allCategoryIds.map((_, index) => `$${index + 1}`).join(', ');
          query += ` AND p."categoryId" IN (${placeholders})`;
          queryParams.push(...allCategoryIds);
        }
        
        console.log('Query:', query);
        console.log('Parameters:', queryParams);
        
        const result = await client.query(query, queryParams);
        console.log(`Products found: ${result.rows[0].count}`);
        
      } else {
        console.log('No active categories found');
      }
    } catch (error) {
      console.log('Error testing category filtering:', error.message);
    }

    console.log('\n✅ Products and categories check completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkProductsAndCategories();
