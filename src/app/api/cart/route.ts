import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Simple database connection function
async function getClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('Database connected successfully');
    return client;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function closeClient(client: Client) {
  try {
    if (client) {
      await client.end();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Get product info from database
async function getProductInfo(productId: string) {
  let dbClient: Client | null = null;
  try {
    console.log('Looking up product with ID:', productId);
    
    dbClient = await getClient();
    
    // Try to find by productId (UUID) first
    let result = await dbClient.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p."categoryId" = c.id WHERE p.id = $1',
      [productId]
    );
    
    // If not found by ID, try to find by SKU
    if (result.rows.length === 0) {
      result = await dbClient.query(
        'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p."categoryId" = c.id WHERE p.sku = $1 OR p.artikul = $1',
        [productId]
      );
    }
    
    if (result.rows.length > 0) {
      const product = result.rows[0];
      console.log('Found product from database:', product.name);
      return {
        name: product.name,
        price: parseFloat(product.price) || 100,
        salePrice: parseFloat(product.salePrice) || parseFloat(product.price) || 80,
        sku: product.sku || product.artikul || `SKU-${productId}`,
        categoryName: product.category_name || 'General'
      };
    }
    
    console.log('No product found for ID:', productId);
    return null;
  } catch (error) {
    console.error('Error in getProductInfo:', error);
    return null;
  } finally {
    if (dbClient) {
      await closeClient(dbClient);
    }
  }
}

// Get user cart
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  console.log('GET /api/cart called for userId:', userId);

  if (!userId) {
    console.log('No userId provided');
    return NextResponse.json(
      { error: 'İstifadəçi ID tələb olunur' },
      { status: 400 }
    );
  }

  try {
    console.log('Getting database client...');
    const dbClient = await getClient();
    console.log('Database client obtained');
    
    try {
      // Check if cart_items table exists
      const tableCheck = await dbClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'cart_items'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('Cart items table does not exist, creating...');
        await dbClient.query(`
          CREATE TABLE cart_items (
            id VARCHAR(255) PRIMARY KEY,
            "userId" VARCHAR(255) NOT NULL,
            "productId" VARCHAR(255) NOT NULL,
            name VARCHAR(500) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            "salePrice" DECIMAL(10,2) NOT NULL,
            images TEXT[],
            stock INTEGER DEFAULT 10,
            sku VARCHAR(255),
            "categoryName" VARCHAR(255),
            quantity INTEGER NOT NULL DEFAULT 1,
            "totalPrice" DECIMAL(10,2) NOT NULL,
            "totalSalePrice" DECIMAL(10,2) NOT NULL,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await dbClient.query(`CREATE INDEX idx_cart_items_user_id ON cart_items("userId")`);
        await dbClient.query(`CREATE INDEX idx_cart_items_product_id ON cart_items("productId")`);
        console.log('Cart items table created successfully');
      }
      
      // Get cart items from database
      console.log('Querying cart items for userId:', userId);
      const result = await dbClient.query(
        'SELECT * FROM cart_items WHERE "userId" = $1 ORDER BY "createdAt" DESC',
        [userId]
      );

      const userCart = result.rows;
      console.log('Raw cart items from database:', userCart);
      
      const totalItems = userCart.reduce((sum, item) => sum + parseInt(item.quantity), 0);
      const totalPrice = userCart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
      const totalSalePrice = userCart.reduce((sum, item) => sum + parseFloat(item.totalSalePrice), 0);

      console.log('Cart from database - items:', userCart.length, 'totalItems:', totalItems);

      const response = {
        success: true,
        cart: {
          items: userCart,
          totalItems,
          totalPrice: Math.round(totalPrice * 100) / 100,
          totalSalePrice: Math.round(totalSalePrice * 100) / 100,
          savings: Math.round((totalPrice - totalSalePrice) * 100) / 100
        }
      };
      
      console.log('Sending cart response:', response);
      return NextResponse.json(response);
      
    } finally {
      await closeClient(dbClient);
    }

  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Səbət məlumatları alınmadı' },
      { status: 500 }
    );
  }
}

// Add item to cart
export async function POST(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    const { userId, productId, quantity = 1 } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID və məhsul ID tələb olunur' },
        { status: 400 }
      );
    }

    console.log('Adding to cart:', { userId, productId, quantity });

    // Get product info
    const productInfo = await getProductInfo(productId);
    
    if (!productInfo) {
      console.log('Product not found:', productId);
      return NextResponse.json(
        { error: 'Məhsul tapılmadı' },
        { status: 404 }
      );
    }

    // Get user discount
    let userDiscount = 0;
    try {
      dbClient = await getClient();
      const userResult = await dbClient.query(
        'SELECT "discountPercentage" FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length > 0) {
        userDiscount = userResult.rows[0].discountPercentage || 0;
        console.log('User discount:', userDiscount, '%');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    // Calculate prices
    const originalPrice = productInfo.price;
    let finalSalePrice = originalPrice;
    
    if (productInfo.salePrice && productInfo.salePrice > 0) {
      finalSalePrice = productInfo.salePrice;
    } else if (userDiscount > 0) {
      finalSalePrice = Math.floor(originalPrice * (1 - userDiscount / 100) * 100) / 100;
    }

    console.log('Price calculation:', { originalPrice, finalSalePrice, productName: productInfo.name });

    // Ensure dbClient is available
    if (!dbClient) {
      dbClient = await getClient();
    }

    // Check if cart_items table exists, create if not
    const tableCheck = await dbClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating cart_items table...');
      await dbClient.query(`
        CREATE TABLE cart_items (
          id VARCHAR(255) PRIMARY KEY,
          "userId" VARCHAR(255) NOT NULL,
          "productId" VARCHAR(255) NOT NULL,
          name VARCHAR(500) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          "salePrice" DECIMAL(10,2) NOT NULL,
          images TEXT[],
          stock INTEGER DEFAULT 10,
          sku VARCHAR(255),
          "categoryName" VARCHAR(255),
          quantity INTEGER NOT NULL DEFAULT 1,
          "totalPrice" DECIMAL(10,2) NOT NULL,
          "totalSalePrice" DECIMAL(10,2) NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await dbClient.query(`CREATE INDEX idx_cart_items_user_id ON cart_items("userId")`);
      await dbClient.query(`CREATE INDEX idx_cart_items_product_id ON cart_items("productId")`);
      console.log('Cart items table created successfully');
    }
    
    // Check if product already exists in cart
    const existingItemResult = await dbClient.query(
      'SELECT * FROM cart_items WHERE "userId" = $1 AND "productId" = $2',
      [userId, productId]
    );
    
    let cartItemData;
    
    if (existingItemResult.rows.length > 0) {
      // Update existing item
      const existingItem = existingItemResult.rows[0];
      const newQuantity = parseInt(existingItem.quantity) + quantity;
      
      const updatedItem = await dbClient.query(
        `UPDATE cart_items 
         SET quantity = $1, "totalPrice" = $2, "totalSalePrice" = $3, "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [
          newQuantity,
          parseFloat(existingItem.price) * newQuantity,
          parseFloat(existingItem.salePrice) * newQuantity,
          existingItem.id
        ]
      );
      
      cartItemData = updatedItem.rows[0];
      console.log('Updated existing cart item:', cartItemData);
    } else {
      // Add new item
      const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const insertResult = await dbClient.query(
        `INSERT INTO cart_items (
          id, "userId", "productId", name, description, price, "salePrice", 
          images, stock, sku, "categoryName", quantity, "totalPrice", "totalSalePrice"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          cartItemId,
          userId,
          productId,
          productInfo.name,
          'Product description',
          originalPrice,
          finalSalePrice,
          [], // images array
          10, // stock
          productInfo.sku,
          productInfo.categoryName,
          quantity,
          originalPrice * quantity,
          finalSalePrice * quantity
        ]
      );
      
      cartItemData = insertResult.rows[0];
      console.log('Added new cart item:', cartItemData);
    }

    return NextResponse.json({
      success: true,
      message: 'Məhsul səbətə əlavə edildi',
      cartItem: cartItemData
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Səbətə əlavə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (dbClient) {
      await closeClient(dbClient);
    }
  }
}

// Update cart item quantity
export async function PUT(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    const { cartItemId, quantity } = await request.json();
    console.log('PUT /api/cart called with:', { cartItemId, quantity });

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Səbət elementi ID və miqdar tələb olunur' },
        { status: 400 }
      );
    }

    dbClient = await getClient();

    // Check if cart item exists
    const checkResult = await dbClient.query(
      'SELECT * FROM cart_items WHERE id = $1',
      [cartItemId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Səbət elementi tapılmadı' },
        { status: 404 }
      );
    }

    const cartItem = checkResult.rows[0];

    if (quantity <= 0) {
      // Delete item if quantity is 0 or negative
      await dbClient.query(
        'DELETE FROM cart_items WHERE id = $1',
        [cartItemId]
      );
      console.log('Cart item deleted:', cartItemId);
    } else {
      // Update quantity
      const newTotalPrice = parseFloat(cartItem.price) * quantity;
      const newTotalSalePrice = parseFloat(cartItem.salePrice) * quantity;
      
      await dbClient.query(
        `UPDATE cart_items
         SET quantity = $1, "totalPrice" = $2, "totalSalePrice" = $3, "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [quantity, newTotalPrice, newTotalSalePrice, cartItemId]
      );
      console.log('Cart item updated:', { cartItemId, quantity, newTotalPrice, newTotalSalePrice });
    }

    return NextResponse.json({
      success: true,
      message: 'Səbət yeniləndi'
    });

  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { error: 'Səbəti yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (dbClient) {
      await closeClient(dbClient);
    }
  }
}

// Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId');
    
    let bodyCartItemId = null;
    try {
      const body = await request.json();
      bodyCartItemId = body.cartItemId;
    } catch (e) {
      // No body or invalid JSON
    }

    const finalCartItemId = cartItemId || bodyCartItemId;

    if (!finalCartItemId) {
      return NextResponse.json(
        { error: 'Səbət elementi ID tələb olunur' },
        { status: 400 }
      );
    }

    console.log('Deleting cart item:', finalCartItemId);

    const dbClient = await getClient();
    await dbClient.query('DELETE FROM cart_items WHERE id = $1', [finalCartItemId]);

    return NextResponse.json({
      success: true,
      message: 'Məhsul səbətdən silindi'
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    return NextResponse.json(
      { error: 'Səbətdən silmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 