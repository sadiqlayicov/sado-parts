import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Database connection
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

// Get product info from database by productId
async function getProductInfo(productId: string) {
  try {
    // First try to get from products API (this is more reliable)
    console.log('Looking up product with ID:', productId);
    
    try {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://sado-parts.vercel.app';
      const productsResponse = await fetch(`${baseUrl}/api/products`);
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        const foundProduct = products.find((p: any) => p.id === productId);
        if (foundProduct) {
          console.log('Found product from API:', foundProduct.name);
          return {
            name: foundProduct.name,
            price: parseFloat(foundProduct.price) || 100,
            salePrice: parseFloat(foundProduct.salePrice) || parseFloat(foundProduct.price) || 80,
            sku: foundProduct.sku || foundProduct.artikul || `SKU-${productId}`,
            categoryName: foundProduct.category?.name || 'General'
          };
        }
      }
    } catch (error) {
      console.error('Error fetching from products API:', error);
    }
    
    // If API fails, try database
    try {
      const dbClient = await getClient();
      
      // Try to find by productId (UUID) first
      let result = await dbClient.query(
        'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p."categoryId" = c.id WHERE p.id = $1',
        [productId]
      );
      
      console.log('Database lookup by ID result:', result.rows.length, 'rows found');
      
      // If not found by ID, try to find by SKU
      if (result.rows.length === 0) {
        console.log('Product not found by ID, trying SKU lookup...');
        result = await dbClient.query(
          'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p."categoryId" = c.id WHERE p.sku = $1',
          [productId]
        );
        console.log('Database lookup by SKU result:', result.rows.length, 'rows found');
      }
      
      if (result.rows.length > 0) {
        const product = result.rows[0];
        console.log('Found product from database:', {
          id: product.id,
          name: product.name,
          price: product.price,
          salePrice: product.salePrice,
          sku: product.sku,
          categoryName: product.category_name
        });
        
        return {
          name: product.name,
          price: parseFloat(product.price) || 100,
          salePrice: parseFloat(product.salePrice) || parseFloat(product.price) || 80,
          sku: product.sku || product.artikul || `SKU-${productId}`,
          categoryName: product.category_name || 'General'
        };
      }
    } catch (dbError) {
      console.error('Error getting product info from database:', dbError);
    }
    
    console.log('No product found for ID:', productId);
    return null;
  } catch (error) {
    console.error('Error in getProductInfo:', error);
    return null;
  } finally {
    // Don't close client here as it might be used by the calling function
  }
}

// Get user cart from database
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'İstifadəçi ID tələb olunur' },
      { status: 400 }
    );
  }

  try {
    const dbClient = await getClient();
    
    // Check if cart_items table exists, if not return empty cart
    try {
      const tableCheck = await dbClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'cart_items'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('Cart items table does not exist, returning empty cart');
        return NextResponse.json({
          success: true,
          cart: {
            items: [],
            totalItems: 0,
            totalPrice: 0,
            totalSalePrice: 0,
            savings: 0
          }
        });
      }
    } catch (tableError) {
      console.error('Error checking table existence:', tableError);
      return NextResponse.json({
        success: true,
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalSalePrice: 0,
          savings: 0
        }
      });
    }
    
    // Get cart items from database
    const result = await dbClient.query(
      'SELECT * FROM cart_items WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );

    const userCart = result.rows;
    
    const totalItems = userCart.reduce((sum, item) => sum + parseInt(item.quantity), 0);
    const totalPrice = userCart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const totalSalePrice = userCart.reduce((sum, item) => sum + parseFloat(item.totalSalePrice), 0);

    return NextResponse.json({
      success: true,
      cart: {
        items: userCart,
        totalItems,
        totalPrice: Math.round(totalPrice * 100) / 100,
        totalSalePrice: Math.round(totalSalePrice * 100) / 100,
        savings: Math.round((totalPrice - totalSalePrice) * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Səbət məlumatları alınmadı' },
      { status: 500 }
    );
  } finally {
    await closeClient();
  }
}

// Add item to cart
export async function POST(request: NextRequest) {
  try {
    const { userId, productId, quantity = 1 } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID və məhsul ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get user info to check discount
    let userDiscount = 0;
    try {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://sado-parts.vercel.app';
      const userResponse = await fetch(`${baseUrl}/api/users/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userDiscount = userData.discountPercentage || 0;
        console.log('User discount fetched:', userDiscount, '%');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    const dbClient = await getClient();
    
    // Check if cart_items table exists, if not create it
    try {
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
        
        // Create indexes
        await dbClient.query(`
          CREATE INDEX idx_cart_items_user_id ON cart_items("userId")
        `);
        
        await dbClient.query(`
          CREATE INDEX idx_cart_items_product_id ON cart_items("productId")
        `);
        
        console.log('Cart items table created successfully');
      }
    } catch (tableError) {
      console.error('Error creating table:', tableError);
      return NextResponse.json(
        { error: 'Səbət cədvəli yaradıla bilmədi' },
        { status: 500 }
      );
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
    } else {
      // Add new item with real product data from database
      let productInfo = null;
      
      // Try to get product info from database first
      try {
        productInfo = await getProductInfo(productId);
        console.log('Product info from database:', { productId, productInfo });
      } catch (error) {
        console.error('Error getting product from database:', error);
      }
      
      // If database lookup fails, return error - no fallback
      if (!productInfo) {
        console.log('Product not found in database:', productId);
        return NextResponse.json(
          { error: 'Məhsul tapılmadı' },
          { status: 404 }
        );
      }

      // Use database salePrice if available, otherwise calculate discount
      const originalPrice = productInfo.price;
      let finalSalePrice = originalPrice;
      
      // If database has salePrice, use it (this is the real discounted price)
      if (productInfo.salePrice && productInfo.salePrice > 0) {
        finalSalePrice = productInfo.salePrice;
        console.log('Using database salePrice:', {
          originalPrice,
          databaseSalePrice: productInfo.salePrice,
          productName: productInfo.name
        });
      } else if (userDiscount > 0) {
        // Fallback to user discount calculation
        const discountedPrice = originalPrice * (1 - userDiscount / 100);
        finalSalePrice = Math.floor(discountedPrice * 100) / 100;
        console.log('Using user discount calculation:', {
          originalPrice,
          userDiscount,
          calculatedSalePrice: finalSalePrice,
          productName: productInfo.name
        });
      }
      
      console.log('Final price calculation:', {
        originalPrice,
        finalSalePrice,
        productName: productInfo.name
      });
      
      const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert new cart item
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
    await closeClient();
  }
}

// Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const { cartItemId, quantity } = await request.json();

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Səbət elementi ID və miqdar tələb olunur' },
        { status: 400 }
      );
    }

    const dbClient = await getClient();
    
    if (quantity <= 0) {
      // Remove item
      await dbClient.query(
        'DELETE FROM cart_items WHERE id = $1',
        [cartItemId]
      );
    } else {
      // Update quantity
      await dbClient.query(
        `UPDATE cart_items 
         SET quantity = $1, "totalPrice" = price * $1, "totalSalePrice" = "salePrice" * $1, "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [quantity, cartItemId]
      );
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
    await closeClient();
  }
}

// Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId');
    
    // Also check for cartItemId in request body for orders API
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
    
    // Delete cart item from database
    await dbClient.query(
      'DELETE FROM cart_items WHERE id = $1',
      [finalCartItemId]
    );

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
  } finally {
    await closeClient();
  }
} 