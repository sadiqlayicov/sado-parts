import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: NextRequest, { params }: any) {
  const { id } = await params;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT p.*, c.name as "categoryName", c.id as "categoryId"
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length > 0) {
      const product = result.rows[0];
      // artikul və catalogNumber undefined olarsa boş string et
      if (product.artikul === undefined || product.artikul === null) product.artikul = '';
      if (product.catalogNumber === undefined || product.catalogNumber === null) product.catalogNumber = '';
      return NextResponse.json(product);
    }
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } finally {
    await client.end();
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  const { id } = await params;
  const data = await request.json();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      UPDATE products 
      SET name = $2, price = $3, "categoryId" = $4, artikul = $5, "catalogNumber" = $6, 
          description = $7, "isActive" = $8, "isFeatured" = $9, images = $10
      WHERE id = $1
      RETURNING *
    `, [
      id, 
      data.name, 
      data.price, 
      data.categoryId, 
      data.artikul ?? '', 
      data.catalogNumber ?? '', 
      data.description, 
      data.isActive, 
      data.isFeatured,
      data.images ? (Array.isArray(data.images) ? data.images : [data.images]) : null
    ]);

    if (result.rows.length > 0) {
      const product = result.rows[0];
      // artikul və catalogNumber undefined olarsa boş string et
      if (product.artikul === undefined || product.artikul === null) product.artikul = '';
      if (product.catalogNumber === undefined || product.catalogNumber === null) product.catalogNumber = '';
      return NextResponse.json(product);
    }
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  } finally {
    await client.end();
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  const { id } = await params;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      DELETE FROM products 
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length > 0) {
      return NextResponse.json({ message: 'Məhsul uğurla silindi.' });
    }
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Məhsulu silmək mümkün olmadı.' }, { status: 500 });
  } finally {
    await client.end();
  }
} 