import { NextRequest } from 'next/server'
import { Pool } from 'pg'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 2, // Limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Helper function to handle database errors
function handleDatabaseError(error: any, operation: string) {
  logError(operation, error)
  
  if (error.message?.includes('Max client connections reached')) {
    return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
  }
  
  return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
}

/**
 * GET - Get single product by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client;
  
  try {
    const { id } = await params;
    
    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Məhsul ID'), 400)
    }

    client = await pool.connect();

    const result = await client.query(`
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
      WHERE p.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Məhsul'), 404)
    }

    const row = result.rows[0];
    const product = {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
      sku: row.sku,
      stock: parseInt(row.stock),
      images: row.images || [],
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      artikul: row.artikul,
      catalogNumber: row.catalogNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      categoryId: row.categoryId,
      category: row.category_name ? {
        id: row.categoryId,
        name: row.category_name,
        description: row.category_description
      } : null
    };

    return successResponse(product, 'Məhsul tapıldı')
  } catch (error: any) {
    return handleDatabaseError(error, 'GET /api/products/[id]')
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * PUT - Update product by ID
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client;
  
  try {
    const { id } = await params;
    const body = await request.json()
    const { name, description, price, salePrice, sku, stock, images, categoryId, isActive, isFeatured, artikul, catalogNumber } = body

    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Məhsul ID'), 400)
    }

    client = await pool.connect();

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(description);
      paramCount++;
    }

    if (price !== undefined) {
      if (isNaN(parseFloat(price))) {
        return errorResponse(ErrorMessages.INVALID_PRICE, 400);
      }
      updateFields.push(`price = $${paramCount}`);
      updateValues.push(parseFloat(price));
      paramCount++;
    }

    if (salePrice !== undefined) {
      updateFields.push(`"salePrice" = $${paramCount}`);
      updateValues.push(salePrice ? parseFloat(salePrice) : null);
      paramCount++;
    }

    if (sku !== undefined) {
      updateFields.push(`sku = $${paramCount}`);
      updateValues.push(sku);
      paramCount++;
    }

    if (stock !== undefined) {
      updateFields.push(`stock = $${paramCount}`);
      updateValues.push(parseInt(stock) || 0);
      paramCount++;
    }

    if (images !== undefined) {
      updateFields.push(`images = $${paramCount}`);
      updateValues.push(images || []);
      paramCount++;
    }

    if (categoryId !== undefined) {
      updateFields.push(`"categoryId" = $${paramCount}`);
      updateValues.push(categoryId);
      paramCount++;
    }

    if (isActive !== undefined) {
      updateFields.push(`"isActive" = $${paramCount}`);
      updateValues.push(isActive);
      paramCount++;
    }

    if (isFeatured !== undefined) {
      updateFields.push(`"isFeatured" = $${paramCount}`);
      updateValues.push(isFeatured);
      paramCount++;
    }

    if (artikul !== undefined) {
      updateFields.push(`artikul = $${paramCount}`);
      updateValues.push(artikul);
      paramCount++;
    }

    if (catalogNumber !== undefined) {
      updateFields.push(`"catalogNumber" = $${paramCount}`);
      updateValues.push(catalogNumber);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return errorResponse('Yeniləmək üçün heç bir field təmin edilməyib', 400);
    }

    // Add updatedAt
    updateFields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    
    // Add ID parameter
    updateValues.push(id);

    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, updateValues);

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Məhsul'), 404)
    }

    // Get updated product with category info
    const productResult = await client.query(`
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
      WHERE p.id = $1
    `, [id]);

    const row = productResult.rows[0];
    const product = {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
      sku: row.sku,
      stock: parseInt(row.stock),
      images: row.images || [],
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      artikul: row.artikul,
      catalogNumber: row.catalogNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      categoryId: row.categoryId,
      category: row.category_name ? {
        id: row.categoryId,
        name: row.category_name,
        description: row.category_description
      } : null
    };

    return successResponse(product, 'Məhsul uğurla yeniləndi')
  } catch (error: any) {
    return handleDatabaseError(error, 'PUT /api/products/[id]')
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * DELETE - Delete product by ID (soft delete by setting isActive to false)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client;
  
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Məhsul ID'), 400)
    }

    client = await pool.connect();

    // Soft delete - set isActive to false
    const result = await client.query(`
      UPDATE products 
      SET 
        "isActive" = false,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Məhsul'), 404)
    }

    return successResponse(result.rows[0], 'Məhsul uğurla silindi')
  } catch (error: any) {
    return handleDatabaseError(error, 'DELETE /api/products/[id]')
  } finally {
    if (client) {
      client.release()
    }
  }
}