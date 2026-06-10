import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;

  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID is required' },
      { status: 400 }
    );
  }

  return withConnection(async (client) => {
    const currentProductResult = await client.query(`
      SELECT "categoryId", name, artikul, "catalogNumber"
      FROM products
      WHERE id::text = $1
    `, [productId]);

    if (currentProductResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const currentProduct = currentProductResult.rows[0];

    if (!currentProduct.categoryId) {
      return NextResponse.json({ success: true, products: [] });
    }

    const similarProductsResult = await client.query(`
      SELECT
        p.id, p.name, p.price, p."salePrice", p.artikul,
        p."catalogNumber", p.stock, p."isActive", p.images,
        p."categoryId", c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."categoryId" = $1
        AND p."isActive" = true
        AND p.id::text != $2
      ORDER BY p."createdAt" DESC
      LIMIT 8
    `, [currentProduct.categoryId, productId]);

    const similarProducts = similarProductsResult.rows;

    if (similarProducts.length >= 4) {
      return NextResponse.json({ success: true, products: similarProducts });
    }

    // Supplement with name-similar products from other categories
    const searchTerms = [
      currentProduct.name?.split(' ')[0],
      currentProduct.artikul?.substring(0, 4),
      currentProduct.catalogNumber?.substring(0, 4)
    ].filter(Boolean);

    if (searchTerms.length > 0) {
      const searchTerm = searchTerms[0];
      const additionalProductsResult = await client.query(`
        SELECT
          p.id, p.name, p.price, p."salePrice", p.artikul,
          p."catalogNumber", p.stock, p."isActive", p.images,
          p."categoryId", c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE (p.name ILIKE $1 OR p.artikul ILIKE $1 OR p."catalogNumber" ILIKE $1)
          AND p."isActive" = true
          AND p.id::text != $2
          AND p."categoryId" != $3
        ORDER BY p."createdAt" DESC
        LIMIT $4
      `, [`%${searchTerm}%`, productId, currentProduct.categoryId, 8 - similarProducts.length]);

      if (additionalProductsResult.rows.length > 0) {
        const combinedProducts = [...similarProducts, ...additionalProductsResult.rows];
        const uniqueProducts = combinedProducts.filter((product, index, self) =>
          index === self.findIndex(p => p.id === product.id)
        );
        return NextResponse.json({ success: true, products: uniqueProducts.slice(0, 8) });
      }
    }

    return NextResponse.json({ success: true, products: similarProducts });
  }, 'GET /api/products/similar/[id]');
}
