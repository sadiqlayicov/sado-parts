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

// Simple cart storage for fallback
const cartStorage = new Map<string, any[]>();

// Get product info from products API
async function getProductInfo(productId: string) {
  try {
    console.log('Looking up product with ID:', productId);
    
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

  if (!userId) {
    return NextResponse.json(
      { error: 'İstifadəçi ID tələb olunur' },
      { status: 400 }
    );
  }

  try {
    // Try database first
    try {
      const dbClient = await getClient();
      
      // Check if cart_items table exists
      const tableCheck = await dbClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'cart_items'
        );
      `);
      
      if (tableCheck.rows[0].exists) {
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
      }
    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
    }
    
    // Fallback to memory storage
    const userCart = cartStorage.get(userId) || [];
    
    const totalItems = userCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = userCart.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalSalePrice = userCart.reduce((sum, item) => sum + item.totalSalePrice, 0);

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
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://sado-parts.vercel.app';
      const userResponse = await fetch(`${baseUrl}/api/users/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userDiscount = userData.discountPercentage || 0;
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

    // Try database first
    try {
      const dbClient = await getClient();
      
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

    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      
      // Fallback to memory storage
      const userCart = cartStorage.get(userId) || [];
      
      // Check if product already exists
      const existingItemIndex = userCart.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = userCart[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        userCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: existingItem.price * newQuantity,
          totalSalePrice: existingItem.salePrice * newQuantity
        };
      } else {
        // Add new item
        const cartItemData = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId: productId,
          name: productInfo.name,
          description: 'Product description',
          price: originalPrice,
          salePrice: finalSalePrice,
          images: [],
          stock: 10,
          sku: productInfo.sku,
          categoryName: productInfo.categoryName,
          quantity: quantity,
          totalPrice: originalPrice * quantity,
          totalSalePrice: finalSalePrice * quantity,
          createdAt: new Date().toISOString()
        };
        
        userCart.push(cartItemData);
      }
      
      cartStorage.set(userId, userCart);

      return NextResponse.json({
        success: true,
        message: 'Məhsul səbətə əlavə edildi (fallback)',
        cartItem: userCart[userCart.length - 1]
      });
    }

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

    // Try database first
    try {
      const dbClient = await getClient();
      
      if (quantity <= 0) {
        await dbClient.query('DELETE FROM cart_items WHERE id = $1', [cartItemId]);
      } else {
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

    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      
      // Fallback to memory storage
      for (const [userId, userCart] of cartStorage.entries()) {
        const itemIndex = userCart.findIndex(item => item.id === cartItemId);
        if (itemIndex >= 0) {
          if (quantity <= 0) {
            userCart.splice(itemIndex, 1);
          } else {
            const item = userCart[itemIndex];
            userCart[itemIndex] = {
              ...item,
              quantity: quantity,
              totalPrice: item.price * quantity,
              totalSalePrice: item.salePrice * quantity
            };
          }
          cartStorage.set(userId, userCart);
          break;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Səbət yeniləndi (fallback)'
      });
    }

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

    // Try database first
    try {
      const dbClient = await getClient();
      await dbClient.query('DELETE FROM cart_items WHERE id = $1', [finalCartItemId]);

      return NextResponse.json({
        success: true,
        message: 'Məhsul səbətdən silindi'
      });

    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      
      // Fallback to memory storage
      for (const [userId, userCart] of cartStorage.entries()) {
        const itemIndex = userCart.findIndex(item => item.id === finalCartItemId);
        if (itemIndex >= 0) {
          userCart.splice(itemIndex, 1);
          cartStorage.set(userId, userCart);
          break;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Məhsul səbətdən silindi (fallback)'
      });
    }

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