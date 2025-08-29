const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
});

async function testCategoryFiltering() {
  let client;
  
  try {
    console.log('Testing category filtering...');
    client = await pool.connect();
    
    // First, let's see what categories we have
    const categoriesResult = await client.query(`
      SELECT id, name, "parentId", "isActive"
      FROM categories 
      WHERE "isActive" = true
      ORDER BY name;
    `);
    
    console.log('\nAvailable categories:');
    categoriesResult.rows.forEach(cat => {
      console.log(`  ${cat.id}: ${cat.name} (parent: ${cat.parentId || 'none'})`);
    });
    
    // Test with the specific category ID from the error
    const testCategoryId = 'cat-hydraulic';
    console.log(`\nTesting with category ID: ${testCategoryId}`);
    
    // Check if this category exists
    const categoryExistsQuery = 'SELECT id, name FROM categories WHERE id = $1 AND "isActive" = true';
    const categoryExistsResult = await client.query(categoryExistsQuery, [testCategoryId]);
    
    if (categoryExistsResult.rows.length === 0) {
      console.log('❌ Category not found:', testCategoryId);
      
      // Let's find a category that contains "hydraulic" in the name
      const hydraulicCategoryQuery = `
        SELECT id, name FROM categories 
        WHERE name ILIKE '%hydraulic%' AND "isActive" = true
        LIMIT 1
      `;
      const hydraulicResult = await client.query(hydraulicCategoryQuery);
      
      if (hydraulicResult.rows.length > 0) {
        console.log('Found hydraulic category:', hydraulicResult.rows[0]);
        await testWithCategory(client, hydraulicResult.rows[0].id, hydraulicResult.rows[0].name);
      } else {
        console.log('No hydraulic category found, testing with first available category');
        if (categoriesResult.rows.length > 0) {
          const firstCategory = categoriesResult.rows[0];
          await testWithCategory(client, firstCategory.id, firstCategory.name);
        }
      }
    } else {
      console.log('✅ Category found:', categoryExistsResult.rows[0]);
      await testWithCategory(client, testCategoryId, categoryExistsResult.rows[0].name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

async function testWithCategory(client, categoryId, categoryName) {
  try {
    console.log(`\nTesting category filtering for: ${categoryName} (${categoryId})`);
    
    // Get subcategories
    const subcategoriesQuery = 'SELECT id FROM categories WHERE "parentId" = $1 AND "isActive" = true';
    const subcategoriesResult = await client.query(subcategoriesQuery, [categoryId]);
    const subcategoryIds = subcategoriesResult.rows.map(row => row.id);
    
    console.log(`Found ${subcategoryIds.length} subcategories:`, subcategoryIds);
    
    // Build the query like in the API
    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p."salePrice",
        p.sku,
        p.stock,
        p.images,
        p."isActive",
        p."isFeatured",
        p.artikul,
        p."catalogNumber",
        p."createdAt",
        p."updatedAt",
        p."categoryId",
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."isActive" = true
    `;
    
    const queryParams = [];
    
    if (subcategoryIds.length === 0) {
      // Only main category, no subcategories
      query += ` AND p."categoryId" = $1`;
      queryParams.push(categoryId);
    } else {
      // Main category + subcategories
      const allCategoryIds = [categoryId, ...subcategoryIds];
      
      // Create placeholders for the IN clause
      const placeholders = allCategoryIds.map((_, index) => `$${index + 1}`).join(', ');
      query += ` AND p."categoryId" IN (${placeholders})`;
      queryParams.push(...allCategoryIds);
    }
    
    query += ` ORDER BY p."createdAt" DESC`;
    
    console.log('Query:', query);
    console.log('Parameters:', queryParams);
    
    // Execute the query
    const productsResult = await client.query(query, queryParams);
    
    console.log(`✅ Found ${productsResult.rows.length} products`);
    
    // Show sample products
    if (productsResult.rows.length > 0) {
      console.log('\nSample products:');
      productsResult.rows.slice(0, 3).forEach(product => {
        console.log(`  ${product.name} (category: ${product.category_name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing category filtering:', error);
  }
}

testCategoryFiltering();
