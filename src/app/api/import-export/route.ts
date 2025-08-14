import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

interface ImportStats {
  total: number;
  created: number;
  updated: number;
  errors: number;
  skipped: number;
}

interface ProductRow {
  artikul?: string;
  name?: string;
  description?: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  sku?: string;
  catalogNumber?: string;
  categoryName?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

// GET - Get import/export status and jobs
export async function GET(request: NextRequest) {
  let client: any;
  
  try {
    client = await pool.connect();
    
    // Create import_jobs table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_jobs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL DEFAULT 'import',
        file_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_items INTEGER DEFAULT 0,
        processed_items INTEGER DEFAULT 0,
        created_count INTEGER DEFAULT 0,
        updated_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Get recent import jobs
    const result = await client.query(`
      SELECT 
        id,
        type,
        file_name,
        status,
        total_items,
        processed_items,
        created_count,
        updated_count,
        error_count,
        error_message,
        created_at
      FROM import_jobs 
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    return NextResponse.json({
      status: 'ready',
      message: 'Система импорта/экспорта готова',
      supportedFormats: ['XLSX', 'XLS', 'CSV', 'JSON'],
      jobs: result.rows || []
    });
  } catch (error: any) {
    console.error('Get import/export error:', error);
    return NextResponse.json(
      { error: `Ошибка получения статуса импорта: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// POST - Handle file import
export async function POST(request: NextRequest) {
  let client: any;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'Файл не выбран' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/json' // .json
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Неподдерживаемый формат файла. Поддерживаются: XLSX, XLS, CSV, JSON' 
      }, { status: 400 });
    }

    client = await pool.connect();

    // Create import_jobs table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_jobs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL DEFAULT 'import',
        file_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_items INTEGER DEFAULT 0,
        processed_items INTEGER DEFAULT 0,
        created_count INTEGER DEFAULT 0,
        updated_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create import job record
    const jobResult = await client.query(`
      INSERT INTO import_jobs (
        type, file_name, status, total_items, processed_items, 
        created_count, updated_count, error_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      'import',
      file.name,
      'processing',
      0,
      0,
      0,
      0,
      0
    ]);

    const jobId = jobResult.rows[0].id;

    // Process file based on type
    let products: ProductRow[] = [];
    
    if (file.type === 'application/json') {
      const text = await file.text();
      const data = JSON.parse(text);
      products = Array.isArray(data) ? data : data.products || [];
    } else {
      // Excel/CSV processing
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('Файл не содержит данных');
      }

      // Get headers from first row
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      // Map data rows to products
      products = dataRows.map(row => {
        const product: ProductRow = {};
        headers.forEach((header, index) => {
          const value = row[index];
          if (value !== undefined && value !== null) {
            switch (header.toLowerCase()) {
              case 'artikul':
              case 'артикул':
                product.artikul = String(value);
                break;
              case 'name':
              case 'название':
              case 'наименование':
                product.name = String(value);
                break;
              case 'description':
              case 'описание':
                product.description = String(value);
                break;
              case 'price':
              case 'цена':
                product.price = parseFloat(value) || 0;
                break;
              case 'saleprice':
              case 'цена со скидкой':
                product.salePrice = parseFloat(value) || null;
                break;
              case 'stock':
              case 'остаток':
              case 'количество':
                product.stock = parseInt(value) || 0;
                break;
              case 'sku':
                product.sku = String(value);
                break;
              case 'catalognumber':
              case 'каталог номер':
                product.catalogNumber = String(value);
                break;
              case 'category':
              case 'категория':
                product.categoryName = String(value);
                break;
              case 'isactive':
              case 'активен':
                product.isActive = Boolean(value);
                break;
              case 'isfeatured':
              case 'рекомендуемый':
                product.isFeatured = Boolean(value);
                break;
            }
          }
        });
        return product;
      });
    }

    // Filter out invalid products
    products = products.filter(p => p.artikul && p.name);

    // Update job with total count
    await client.query(`
      UPDATE import_jobs 
      SET total_items = $1 
      WHERE id = $2
    `, [products.length, jobId]);

    const stats: ImportStats = {
      total: products.length,
      created: 0,
      updated: 0,
      errors: 0,
      skipped: 0
    };

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Check if product exists by artikul
        const existingProduct = await client.query(`
          SELECT id, "categoryId" FROM products WHERE artikul = $1
        `, [product.artikul]);

        if (existingProduct.rows.length > 0) {
          // Update existing product
          const productId = existingProduct.rows[0].id;
          
          await client.query(`
            UPDATE products 
            SET 
              name = $1,
              description = $2,
              price = $3,
              "salePrice" = $4,
              stock = $5,
              sku = $6,
              "catalogNumber" = $7,
              "isActive" = $8,
              "isFeatured" = $9,
              "updatedAt" = NOW()
            WHERE id = $10
          `, [
            product.name,
            product.description || '',
            product.price || 0,
            product.salePrice,
            product.stock || 0,
            product.sku || '',
            product.catalogNumber || '',
            product.isActive !== false, // Default to true
            product.isFeatured || false,
            productId
          ]);

          stats.updated++;
        } else {
          // Create new product
          let categoryId = '1'; // Default category
          
          if (product.categoryName) {
            // Try to find or create category
            const categoryResult = await client.query(`
              SELECT id FROM categories WHERE name = $1
            `, [product.categoryName]);
            
            if (categoryResult.rows.length > 0) {
              categoryId = categoryResult.rows[0].id;
            } else {
              // Create new category
              const newCategoryResult = await client.query(`
                INSERT INTO categories (name, description, "isActive")
                VALUES ($1, $2, $3)
                RETURNING id
              `, [product.categoryName, '', true]);
              categoryId = newCategoryResult.rows[0].id;
            }
          }

          await client.query(`
            INSERT INTO products (
              artikul, name, description, price, "salePrice", stock,
              sku, "catalogNumber", "categoryId", "isActive", "isFeatured"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            product.artikul,
            product.name,
            product.description || '',
            product.price || 0,
            product.salePrice,
            product.stock || 0,
            product.sku || '',
            product.catalogNumber || '',
            categoryId,
            product.isActive !== false,
            product.isFeatured || false
          ]);

          stats.created++;
        }

        // Update job progress
        await client.query(`
          UPDATE import_jobs 
          SET 
            processed_items = $1,
            created_count = $2,
            updated_count = $3,
            error_count = $4
          WHERE id = $5
        `, [
          i + 1,
          stats.created,
          stats.updated,
          stats.errors,
          jobId
        ]);

      } catch (error: any) {
        console.error(`Error processing product ${product.artikul}:`, error);
        stats.errors++;
        
        // Update job with error
        await client.query(`
          UPDATE import_jobs 
          SET 
            error_count = $1,
            error_message = $2
          WHERE id = $3
        `, [
          stats.errors,
          `Ошибка обработки товара ${product.artikul}: ${error.message}`,
          jobId
        ]);
      }
    }

    // Mark job as completed
    await client.query(`
      UPDATE import_jobs 
      SET status = 'completed'
      WHERE id = $1
    `, [jobId]);

    return NextResponse.json({
      success: true,
      message: 'Импорт завершен успешно',
      jobId,
      stats
    });

  } catch (error: any) {
    console.error('Import error:', error);
    
    // Update job with error if jobId exists
    if (client) {
      try {
        await client.query(`
          UPDATE import_jobs 
          SET 
            status = 'failed',
            error_message = $1
          WHERE status = 'processing'
        `, [error.message]);
      } catch (updateError) {
        console.error('Error updating job status:', updateError);
      }
    }
    
    return NextResponse.json({ 
      error: `Ошибка импорта: ${error.message}` 
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
} 