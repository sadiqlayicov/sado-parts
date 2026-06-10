import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Declare global variables for 1C integration
declare global {
  var uploadedFileContent: string | null;
  var lastActivityTime: string | null;
  var uploadProgress: string;
  var recentLogs: Array<{timestamp: string, message: string}>;
}

// Initialize global variable
if (!global.uploadedFileContent) {
  global.uploadedFileContent = null;
}

// Initialize global variables for tracking
if (!global.lastActivityTime) {
  global.lastActivityTime = null;
}
if (!global.uploadProgress) {
  global.uploadProgress = 'Waiting for 1C...';
}
if (!global.recentLogs) {
  global.recentLogs = [];
}

// Helper function to add log
function addLog(message: string) {
  const timestamp = new Date().toISOString();
  global.lastActivityTime = timestamp;
  global.recentLogs = global.recentLogs || [];
  global.recentLogs.unshift({ timestamp, message });
  
  // Keep only last 10 logs
  if (global.recentLogs.length > 10) {
    global.recentLogs = global.recentLogs.slice(0, 10);
  }
  
  console.log(`[${timestamp}] ${message}`);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

function authenticateRequest(request: NextRequest): boolean {
  const expectedUser = process.env.EXCHANGE_1C_USERNAME;
  const expectedPass = process.env.EXCHANGE_1C_PASSWORD;

  if (!expectedUser || !expectedPass) {
    console.error('1C exchange credentials not configured (EXCHANGE_1C_USERNAME / EXCHANGE_1C_PASSWORD)');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [user, pass] = credentials.split(':');

  return user === expectedUser && pass === expectedPass;
}

export async function GET(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return new NextResponse('failure\nAuth required', { status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const mode = searchParams.get('mode');

  console.log('🔍 1C Exchange GET request:', { type, mode, url: request.url });
  addLog(`🔍 1C GET: ${type}/${mode} - ${request.url}`);

  // A. Начало сеанса (Session Start)
  if (type === 'catalog' && mode === 'checkauth') {
    addLog('✅ 1C Session start - checkauth');
    global.uploadProgress = 'Authentication successful';
    
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
    addLog('✅ 1C Parameters request - init');
    global.uploadProgress = 'Parameters initialized';
    
    const response = `zip=no
file_limit=1048576`;

    return new NextResponse(response, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Log unknown requests
  addLog(`❓ Unknown GET request: ${type}/${mode} - ${request.url}`);
  
  // Default response
  return new NextResponse('success', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export async function POST(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return new NextResponse('failure\nAuth required', { status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const mode = searchParams.get('mode');
  const filename = searchParams.get('filename');

  console.log('🔍 1C Exchange POST request:', { type, mode, filename, url: request.url });
  addLog(`🔍 1C POST: ${type}/${mode} - ${filename || 'no filename'} - ${request.url}`);

  // C. Выгрузка файлов (File Upload)
  if (type === 'catalog' && mode === 'file') {
    addLog(`📁 1C File upload started: ${filename}`);
    global.uploadProgress = `Receiving file: ${filename}`;
    
    try {
      const body = await request.text();
      addLog(`📁 Received file content length: ${body.length} bytes`);
      addLog(`📄 File content preview: ${body.substring(0, 200)}...`);
      
      // Check if it's XML content
      const isXml = body.includes('<?xml') || body.includes('<Товар') || body.includes('<Каталог') || body.includes('<КоммерческаяИнформация');
      addLog(`🔍 Is XML content: ${isXml}`);
      
      // Count products in XML
      const productCount = (body.match(/<Товар/g) || []).length;
      const catalogCount = (body.match(/<Каталог/g) || []).length;
      const commercialInfoCount = (body.match(/<КоммерческаяИнформация/g) || []).length;
      
      addLog(`📦 Products found in XML: ${productCount}`);
      addLog(`📚 Catalogs found in XML: ${catalogCount}`);
      addLog(`🏢 Commercial info found in XML: ${commercialInfoCount}`);
      
      global.uploadProgress = `File received: ${productCount} products, ${catalogCount} catalogs`;
      
      // Store the file content for processing
      global.uploadedFileContent = body;
      
      addLog(`✅ File upload completed successfully`);
      
      return new NextResponse('success', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } catch (error) {
      console.error('❌ Error processing file upload:', error);
      addLog(`❌ File upload error: ${error}`);
      return new NextResponse('failure', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  }

  // D. Пошаговая загрузка данных (Step-by-step data import)
  if (type === 'catalog' && mode === 'import') {
    addLog('🔄 1C Data import started');
    console.log('🔄 1C Data import:', filename);
    
    try {
      // Process the uploaded file content
      if (global.uploadedFileContent) {
        console.log('🔄 Starting product import...');
        const result = await importProductsFromCommerceML(global.uploadedFileContent);
        console.log('✅ Import completed:', result);
        addLog('✅ Product import completed successfully');
        
        // Clear the stored content
        global.uploadedFileContent = null;
        
        return new NextResponse('success', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      } else {
        console.log('⚠️ No file content found for import');
        addLog('⚠️ No file content found for import');
        return new NextResponse('failure', {
          status: 400,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }
    } catch (error) {
      console.error('❌ Error during import:', error);
      addLog(`❌ Import error: ${error}`);
      return new NextResponse('failure', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  }

  // Log unknown POST requests
  addLog(`❓ Unknown POST request: ${type}/${mode} - ${request.url}`);
  
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
    
    // Parse XML content
    const products: any[] = [];
    
    // Extract products from XML
    const productMatches = xmlContent.match(/<Товар[^>]*>([\s\S]*?)<\/Товар>/g);
    
    if (productMatches) {
      for (const productMatch of productMatches) {
        try {
          // Extract basic product information
          const idMatch = productMatch.match(/<Ид>([^<]+)<\/Ид>/);
          const nameMatch = productMatch.match(/<Наименование>([^<]+)<\/Наименование>/);
          const skuMatch = productMatch.match(/<Артикул>([^<]+)<\/Артикул>/);
          const descriptionMatch = productMatch.match(/<Описание>([^<]+)<\/Описание>/);
          const priceMatch = productMatch.match(/<ЦенаЗаЕдиницу>([^<]+)<\/ЦенаЗаЕдиницу>/);
          const categoryMatch = productMatch.match(/<Группы>([^<]+)<\/Группы>/);
          
          // Extract additional attributes
          const fullNameMatch = productMatch.match(/<НаименованиеПолное>([^<]+)<\/НаименованиеПолное>/);
          const catalogNumberMatch = productMatch.match(/<КаталожныйНомер>([^<]+)<\/КаталожныйНомер>/);
          const commentMatch = productMatch.match(/<Комментарий>([^<]+)<\/Комментарий>/);
          
          const product = {
            id: idMatch ? idMatch[1] : null,
            name: nameMatch ? nameMatch[1] : (fullNameMatch ? fullNameMatch[1] : 'Без названия'),
            sku: skuMatch ? skuMatch[1] : (catalogNumberMatch ? catalogNumberMatch[1] : ''),
            description: descriptionMatch ? descriptionMatch[1] : (commentMatch ? commentMatch[1] : ''),
            price: priceMatch ? parseFloat(priceMatch[1]) || 0 : 0,
            category: categoryMatch ? categoryMatch[1] : 'Общие',
            hasImage: productMatch.includes('<Картинка>'),
            hasPrice: priceMatch && parseFloat(priceMatch[1]) > 0,
            // Additional attributes
            fullName: fullNameMatch ? fullNameMatch[1] : '',
            catalogNumber: catalogNumberMatch ? catalogNumberMatch[1] : '',
            comment: commentMatch ? commentMatch[1] : ''
          };
          
          products.push(product);
        } catch (error) {
          console.error('Error parsing individual product:', error);
        }
      }
    }
    
    console.log(`📦 Found ${products.length} products in XML`);
    addLog(`📦 Parsed ${products.length} products from XML`);
    
    // Import products to database
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const product of products) {
      try {
        // Check if product exists
        const existingProduct = await client.query(
          'SELECT id FROM products WHERE 1c_id = $1 OR sku = $2',
          [product.id, product.sku]
        );
        
        if (existingProduct.rows.length > 0) {
          // Update existing product
          await client.query(`
            UPDATE products 
            SET name = $1, description = $2, price = $3, category_name = $4, 
                sku = $5, full_name = $6, catalog_number = $7, comment = $8, updated_at = NOW()
            WHERE 1c_id = $9 OR sku = $10
          `, [product.name, product.description, product.price, product.category, 
              product.sku, product.fullName, product.catalogNumber, product.comment, 
              product.id, product.sku]);
          updatedCount++;
        } else {
          // Insert new product
          await client.query(`
            INSERT INTO products (1c_id, name, sku, description, price, category_name, 
                                 stock_quantity, full_name, catalog_number, comment, 
                                 created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, NOW(), NOW())
          `, [product.id, product.name, product.sku, product.description, product.price, 
              product.category, product.fullName, product.catalogNumber, product.comment]);
          importedCount++;
        }
      } catch (error) {
        console.error(`Error importing product ${product.name}:`, error);
      }
    }
    
    addLog(`✅ Import completed: ${importedCount} new, ${updatedCount} updated`);
    
    return {
      totalProducts: products.length,
      imported: importedCount,
      updated: updatedCount,
      withPrice: products.filter(p => p.hasPrice).length,
      withImage: products.filter(p => p.hasImage).length,
      withoutPrice: products.filter(p => !p.hasPrice).length,
      withoutImage: products.filter(p => !p.hasImage).length
    };
    
  } catch (error) {
    console.error('❌ Error in importProductsFromCommerceML:', error);
    addLog(`❌ Import error: ${error}`);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
