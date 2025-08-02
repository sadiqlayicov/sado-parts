import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Vercel üçün connection pool
let client: Client | null = null;

async function getClient() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.end();
  }
  return client;
}

async function closeClient() {
  if (client) {
    await client.end();
    client = null;
  }
}

// Get user cart
export async function GET(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get user cart items with product details
    const cartResult = await dbClient.query(`
      SELECT ci.id, ci.quantity, ci."createdAt",
             p.id as "productId", p.name, p.description, p.price, p."salePrice", p.images, p.stock, p.sku,
             c.name as "categoryName"
      FROM cart_items ci
      JOIN products p ON ci."productId" = p.id
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE ci."userId" = $1 AND ci."isActive" = true
      ORDER BY ci."createdAt" DESC
    `, [userId]);

    // Calculate totals
    let totalItems = 0;
    let totalPrice = 0;
    let totalSalePrice = 0;

    const cartItems = cartResult.rows.map((item: any) => {
      const quantity = parseInt(item.quantity);
      const price = parseFloat(item.price);
      const salePrice = item.salePrice ? parseFloat(item.salePrice) : price;
      
      totalItems += quantity;
      totalPrice += price * quantity;
      totalSalePrice += salePrice * quantity;

      return {
        id: item.id,
        productId: item.productId,
        name: item.name,
        description: item.description,
        price: price,
        salePrice: salePrice,
        images: item.images,
        stock: parseInt(item.stock),
        sku: item.sku,
        categoryName: item.categoryName,
        quantity: quantity,
        totalPrice: price * quantity,
        totalSalePrice: salePrice * quantity,
        createdAt: item.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      cart: {
        items: cartItems,
        totalItems,
        totalPrice: Math.round(totalPrice * 100) / 100,
        totalSalePrice: Math.round(totalSalePrice * 100) / 100,
        savings: Math.round((totalPrice - totalSalePrice) * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Səbət məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

// Add item to cart
export async function POST(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { userId, productId, quantity = 1 } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID və məhsul ID tələb olunur' },
        { status: 400 }
      );
    }

    // Check if product exists and has stock
    const productResult = await dbClient.query(`
      SELECT id, name, price, stock FROM products WHERE id = $1 AND "isActive" = true
    `, [productId]);

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Məhsul tapılmadı' },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];
    if (parseInt(product.stock) < quantity) {
      return NextResponse.json(
        { error: 'Kifayət qədər stok yoxdur' },
        { status: 400 }
      );
    }

    // Check if item already exists in cart
    const existingItem = await dbClient.query(`
      SELECT id, quantity FROM cart_items 
      WHERE "userId" = $1 AND "productId" = $2 AND "isActive" = true
    `, [userId, productId]);

    if (existingItem.rows.length > 0) {
      // Update existing item
      const newQuantity = parseInt(existingItem.rows[0].quantity) + quantity;
      await dbClient.query(`
        UPDATE cart_items SET quantity = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [newQuantity, existingItem.rows[0].id]);
    } else {
      // Add new item
      await dbClient.query(`
        INSERT INTO cart_items (id, "userId", "productId", quantity, "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
      `, [userId, productId, quantity]);
    }

    return NextResponse.json({
      success: true,
      message: 'Məhsul səbətə əlavə edildi'
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Səbətə əlavə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

// Update cart item
export async function PUT(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { cartItemId, quantity } = await request.json();

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Səbət elementi ID və miqdar tələb olunur' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await dbClient.query(`
        UPDATE cart_items SET "isActive" = false, "updatedAt" = NOW()
        WHERE id = $1
      `, [cartItemId]);
    } else {
      // Update quantity
      await dbClient.query(`
        UPDATE cart_items SET quantity = $1, "updatedAt" = NOW()
        WHERE id = $1
      `, [quantity, cartItemId]);
    }

    return NextResponse.json({
      success: true,
      message: 'Səbət yeniləndi'
    });

  } catch (error) {
    console.error('Update cart error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Səbəti yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

// Remove item from cart
export async function DELETE(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId');

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'Səbət elementi ID tələb olunur' },
        { status: 400 }
      );
    }

    await dbClient.query(`
      UPDATE cart_items SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = $1
    `, [cartItemId]);

    return NextResponse.json({
      success: true,
      message: 'Məhsul səbətdən silindi'
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Səbətdən silmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 