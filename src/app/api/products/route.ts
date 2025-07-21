import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all products
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: { category: true }
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Məhsulları əldə etmə xətası' },
      { status: 500 }
    )
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, salePrice, sku, stock, images, categoryId, isActive, isFeatured } = body

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        sku,
        stock: parseInt(stock) || 0,
        images: images ? JSON.stringify(images) : null,
        categoryId,
        isActive,
        isFeatured
      },
      include: { category: true }
    })

    return NextResponse.json({
      message: 'Məhsul uğurla əlavə olundu',
      product
    }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Məhsul əlavə etmə xətası' },
      { status: 500 }
    )
  }
} 