import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Connection pool for better performance
let client: Client | null = null;

async function getClient() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
  }
  return client;
}

async function closeClient() {
  if (client) {
    await client.end();
    client = null;
  }
}

// Product cache for better performance
const productCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get product info from database with caching
async function getProductInfo(productId: string) {
  try {
    // Check cache first
    const cached = productCache.get(productId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Product found in cache:', productId);
      return cached.data;
    }
    
    console.log('Looking up product with ID:', productId);
    
    const dbClient = await getClient();
    
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
      const productInfo = {
        name: product.name,
        price: parseFloat(product.price) || 100,
        salePrice: parseFloat(product.salePrice) || null, // Only use salePrice if it exists, otherwise null
        sku: product.sku || product.artikul || `SKU-${productId}`,
        categoryName: product.category_name || 'General'
      };
      
      // Cache the result
      productCache.set(productId, {
        data: productInfo,
        timestamp: Date.now()
      });
      
      console.log('Found product from database and cached:', product.name);
      return productInfo;
    }
    
    console.log('No product found for ID:', productId);
    return null;
  } catch (error) {
    console.error('Error in getProductInfo:', error);
    return null;
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
      
      // Get user discount first
      let userDiscount = 0;
      try {
        const userResult = await dbClient.query(
          'SELECT "discountPercentage" FROM users WHERE id = $1',
          [userId]
        );
        if (userResult.rows.length > 0) {
          userDiscount = userResult.rows[0].discountPercentage || 0;
        }
      } catch (error) {
        console.error('Error fetching user discount:', error);
      }

      // Get cart items from database
      console.log('Querying cart items for userId:', userId);
      const result = await dbClient.query(
        'SELECT * FROM cart_items WHERE "userId" = $1 ORDER BY "createdAt" DESC',
        [userId]
      );

      const userCart = result.rows;
      console.log('Raw cart items from database:', userCart);
      
      // Recalculate prices based on current user discount
      const recalculatedCart = userCart.map(item => {
        const originalPrice = parseFloat(item.price);
        let finalSalePrice = originalPrice;
        
        // Apply current user discount if any
        if (userDiscount > 0) {
          finalSalePrice = Math.floor(originalPrice * (1 - userDiscount / 100) * 100) / 100;
        } else if (parseFloat(item.salePrice) > 0 && parseFloat(item.salePrice) < originalPrice) {
          // Use stored sale price only if no user discount
          finalSalePrice = parseFloat(item.salePrice);
        }
        
        const quantity = parseInt(item.quantity);
        const newTotalPrice = originalPrice * quantity;
        const newTotalSalePrice = finalSalePrice * quantity;
        
        return {
          ...item,
          salePrice: finalSalePrice,
          totalPrice: newTotalPrice,
          totalSalePrice: newTotalSalePrice
        };
      });
      
      const totalItems = recalculatedCart.reduce((sum, item) => sum + parseInt(item.quantity), 0);
      const totalPrice = recalculatedCart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
      const totalSalePrice = recalculatedCart.reduce((sum, item) => sum + parseFloat(item.totalSalePrice), 0);

      console.log('Cart from database - items:', recalculatedCart.length, 'totalItems:', totalItems);

      const response = {
        success: true,
        cart: {
          items: recalculatedCart,
          totalItems,
          totalPrice: Math.round(totalPrice * 100) / 100,
          totalSalePrice: Math.round(totalSalePrice * 100) / 100,
          savings: Math.round((totalPrice - totalSalePrice) * 100) / 100
        }
      };
      
      console.log('Sending cart response:', response);
      return NextResponse.json(response);
      
    } finally {
      await closeClient();
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
// Request deduplication for better performance
const pendingRequests = new Map<string, Promise<any>>();

export async function POST(request: NextRequest) {
  let requestKey: string | null = null;
  
  try {
    const { userId, productId, quantity = 1 } = await request.json();
    
    let dbClient: Client | null = null;

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID və məhsul ID tələb olunur' },
        { status: 400 }
      );
    }

    // Create a unique key for this request
    requestKey = `${userId}-${productId}`;
    
    // Check if there's already a pending request for this user-product combination
    if (pendingRequests.has(requestKey)) {
      console.log('Request already in progress, returning existing promise');
      return await pendingRequests.get(requestKey);
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

    // Calculate prices with proper discount logic
    const originalPrice = productInfo.price;
    let finalSalePrice = originalPrice;
    
    // Priority: 1. User discount (if any), 2. Product sale price (if no user discount)
    if (userDiscount > 0) {
      // Apply user discount to original price
      finalSalePrice = Math.floor(originalPrice * (1 - userDiscount / 100) * 100) / 100;
    } else if (productInfo.salePrice && productInfo.salePrice > 0) {
      // Use product sale price only if no user discount
      finalSalePrice = productInfo.salePrice;
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

    const response = NextResponse.json({
      success: true,
      message: 'Məhsul səbətə əlavə edildi',
      cartItem: cartItemData
    });

    // Clean up pending request
    if (requestKey) {
      pendingRequests.delete(requestKey);
    }
    
    return response;

  } catch (error) {
    console.error('Add to cart error:', error);
    
    // Clean up pending request on error
    if (requestKey) {
      pendingRequests.delete(requestKey);
    }
    
    return NextResponse.json(
      { error: 'Səbətə əlavə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await closeClient();
  }
}

// Quantity update deduplication
const quantityUpdateRequests = new Map<string, Promise<any>>();

// Update cart item quantity
export async function PUT(request: NextRequest) {
  let requestKey: string | null = null;
  
  try {
    const { cartItemId, quantity } = await request.json();
    
    let dbClient: Client | null = null;
    console.log('PUT /api/cart called with:', { cartItemId, quantity });

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Səbət elementi ID və miqdar tələb olunur' },
        { status: 400 }
      );
    }

    // Create a unique key for this quantity update request
    requestKey = `quantity-${cartItemId}`;
    
    // Check if there's already a pending quantity update for this cart item
    if (quantityUpdateRequests.has(requestKey)) {
      console.log('Quantity update already in progress, returning existing promise');
      return await quantityUpdateRequests.get(requestKey);
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

    // Get user discount for proper price calculation
    let userDiscount = 0;
    try {
      const userResult = await dbClient.query(
        'SELECT "discountPercentage" FROM users WHERE id = $1',
        [cartItem.userId]
      );
      if (userResult.rows.length > 0) {
        userDiscount = userResult.rows[0].discountPercentage || 0;
      }
    } catch (error) {
      console.error('Error fetching user discount:', error);
    }

    if (quantity <= 0) {
      // Delete item if quantity is 0 or negative
      await dbClient.query(
        'DELETE FROM cart_items WHERE id = $1',
        [cartItemId]
      );
      console.log('Cart item deleted:', cartItemId);
    } else {
      // Recalculate prices based on current user discount
      const originalPrice = parseFloat(cartItem.price);
      let finalSalePrice = originalPrice;
      
      // Apply current user discount if any
      if (userDiscount > 0) {
        finalSalePrice = Math.floor(originalPrice * (1 - userDiscount / 100) * 100) / 100;
      } else if (parseFloat(cartItem.salePrice) > 0 && parseFloat(cartItem.salePrice) < originalPrice) {
        // Use stored sale price only if no user discount
        finalSalePrice = parseFloat(cartItem.salePrice);
      }
      
      const newTotalPrice = originalPrice * quantity;
      const newTotalSalePrice = finalSalePrice * quantity;
      
      await dbClient.query(
        `UPDATE cart_items
         SET quantity = $1, "salePrice" = $2, "totalPrice" = $3, "totalSalePrice" = $4, "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [quantity, finalSalePrice, newTotalPrice, newTotalSalePrice, cartItemId]
      );
      console.log('Cart item updated:', { cartItemId, quantity, newTotalPrice, newTotalSalePrice });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Səbət yeniləndi'
    });

    // Clean up pending request
    if (requestKey) {
      quantityUpdateRequests.delete(requestKey);
    }
    
    return response;

  } catch (error) {
    console.error('Update cart error:', error);
    
    // Clean up pending request on error
    if (requestKey) {
      quantityUpdateRequests.delete(requestKey);
    }
    
    return NextResponse.json(
      { error: 'Səbəti yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await closeClient();
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