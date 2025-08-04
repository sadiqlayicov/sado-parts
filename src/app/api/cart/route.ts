import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// In-memory cart storage (in production, this should be in database)
const cartStorage = new Map<string, any[]>();

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
    const dbClient = await getClient();
    
    // First try to find by productId (if it's a UUID)
    let result = await dbClient.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [productId]
    );
    
    if (result.rows.length === 0) {
      // If not found by UUID, try to find by name (for legacy support)
      const productName = productId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      result = await dbClient.query(
        'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE LOWER(p.name) = LOWER($1)',
        [productName]
      );
    }
    
    if (result.rows.length > 0) {
      const product = result.rows[0];
      return {
        name: product.name,
        price: parseFloat(product.price) || 100,
        salePrice: parseFloat(product.sale_price) || parseFloat(product.price) || 80,
        sku: product.sku || product.artikul || `SKU-${productId}`,
        categoryName: product.category_name || 'General'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting product info from database:', error);
    return null;
  }
}

// Simple cart API with in-memory storage
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'İstifadəçi ID tələb olunur' },
      { status: 400 }
    );
  }

  // Get cart items from memory storage
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
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId, quantity = 1 } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID və məhsul ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get current user cart
    const userCart = cartStorage.get(userId) || [];
    
    console.log('Adding to cart - productId:', productId); // Debug log
    
    // Check if product already exists in cart
    const existingItemIndex = userCart.findIndex(item => item.productId === productId);
    
    let cartItemData;
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = userCart[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      cartItemData = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: existingItem.price * newQuantity,
        totalSalePrice: existingItem.salePrice * newQuantity
      };
      
      userCart[existingItemIndex] = cartItemData;
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
      
      // Fallback to hardcoded mapping if database lookup fails
      if (!productInfo) {
        const productMap: { [key: string]: any } = {
          'fuel-filter': {
            name: 'Fuel Filter',
            price: 30,
            salePrice: 24,
            sku: 'FUEL-FIL-010',
            categoryName: 'Filters'
          },
          'hydraulic-hose': {
            name: 'Hydraulic Hose',
            price: 75,
            salePrice: 60,
            sku: 'HYD-HOSE-009',
            categoryName: 'Hydraulic Systems'
          },
          'body-panel-front-bumper': {
            name: 'Body Panel - Front Bumper',
            price: 320,
            salePrice: 256,
            sku: 'BODY-BUMP-008',
            categoryName: 'Body Parts'
          },
          'tire-set-4-pieces': {
            name: 'Tire Set (4 pieces)',
            price: 450,
            salePrice: 360,
            sku: 'TIRE-SET-007',
            categoryName: 'Tires & Wheels'
          }
        };
        
        productInfo = productMap[productId] || {
          name: `Product ${productId}`,
          price: 100,
          salePrice: 80,
          sku: `SKU-${productId}`,
          categoryName: 'General'
        };
        
        console.log('Using fallback product mapping:', { productId, productInfo });
      }

      cartItemData = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: productId,
        name: productInfo.name,
        description: 'Product description',
        price: productInfo.price,
        salePrice: productInfo.salePrice,
        images: [],
        stock: 10,
        sku: productInfo.sku,
        categoryName: productInfo.categoryName,
        quantity: quantity,
        totalPrice: productInfo.price * quantity,
        totalSalePrice: productInfo.salePrice * quantity,
        createdAt: new Date().toISOString()
      };
      
      userCart.push(cartItemData);
    }
    
    // Save updated cart
    cartStorage.set(userId, userCart);

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
    // Close database connection
    await closeClient();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { cartItemId, quantity } = await request.json();

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Səbət elementi ID və miqdar tələb olunur' },
        { status: 400 }
      );
    }

    // Find and update cart item in all user carts
    for (const [userId, userCart] of cartStorage.entries()) {
      const itemIndex = userCart.findIndex(item => item.id === cartItemId);
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item
          userCart.splice(itemIndex, 1);
        } else {
          // Update quantity
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
      message: 'Səbət yeniləndi'
    });

  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { error: 'Səbəti yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

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

    console.log('Deleting cart item:', finalCartItemId); // Debug log

    // Find and remove cart item from all user carts
    for (const [userId, userCart] of cartStorage.entries()) {
      const itemIndex = userCart.findIndex(item => item.id === finalCartItemId);
      if (itemIndex >= 0) {
        userCart.splice(itemIndex, 1);
        cartStorage.set(userId, userCart);
        console.log('Cart item deleted successfully'); // Debug log
        break;
      }
    }

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