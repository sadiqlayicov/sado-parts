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
    
    console.log('Looking up product with ID:', productId); // Debug log
    
    // Try to find by productId (UUID) first
    let result = await dbClient.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p."categoryId" = c.id WHERE p.id = $1',
      [productId]
    );
    
    console.log('Database lookup by ID result:', result.rows.length, 'rows found'); // Debug log
    
    // If not found by ID, try to find by SKU
    if (result.rows.length === 0) {
      console.log('Product not found by ID, trying SKU lookup...');
      result = await dbClient.query(
        'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p."categoryId" = c.id WHERE p.sku = $1',
        [productId]
      );
      console.log('Database lookup by SKU result:', result.rows.length, 'rows found');
    }
    
    // If still not found, try to get from products API
    if (result.rows.length === 0) {
      console.log('Product not found in database, trying products API...');
      try {
        const productsResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/products`);
        if (productsResponse.ok) {
          const products = await productsResponse.json();
          const foundProduct = products.find((p: any) => p.id === productId || p.sku === productId);
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
    }
    
    if (result.rows.length > 0) {
      const product = result.rows[0];
      console.log('Found product:', {
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
    
    console.log('No product found for ID/SKU:', productId); // Debug log
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

    // Get user info to check discount
    let userDiscount = 0;
    try {
      const userResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/users/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userDiscount = userData.discountPercentage || 0;
        console.log('User discount fetched:', userDiscount, '%');
        console.log('Full user data:', userData);
      } else {
        console.log('Failed to fetch user data, status:', userResponse.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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
      
      // If database lookup fails, return error - no fallback
      if (!productInfo) {
        console.log('Product not found in database:', productId);
        return NextResponse.json(
          { error: 'Məhsul tapılmadı' },
          { status: 404 }
        );
      }

      // Calculate discounted price if user has discount
      const originalPrice = productInfo.price;
      const discountedPrice = userDiscount > 0 ? originalPrice * (1 - userDiscount / 100) : originalPrice;
      
      console.log('Price calculation:', {
        originalPrice,
        userDiscount,
        discountedPrice,
        productName: productInfo.name,
        finalSalePrice: Math.floor(discountedPrice * 100) / 100
      });
      
      // Ensure we're using the discounted price as salePrice (same as AuthProvider)
      const finalSalePrice = Math.floor(discountedPrice * 100) / 100;
      
      cartItemData = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: productId,
        name: productInfo.name,
        description: 'Product description',
        price: originalPrice,
        salePrice: finalSalePrice, // Use the calculated discounted price
        images: [],
        stock: 10,
        sku: productInfo.sku,
        categoryName: productInfo.categoryName,
        quantity: quantity,
        totalPrice: originalPrice * quantity,
        totalSalePrice: finalSalePrice * quantity,
        createdAt: new Date().toISOString()
      };
      
      console.log('Final cart item data:', {
        name: cartItemData.name,
        originalPrice: cartItemData.price,
        salePrice: cartItemData.salePrice,
        quantity: cartItemData.quantity,
        totalPrice: cartItemData.totalPrice,
        totalSalePrice: cartItemData.totalSalePrice
      });
      
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