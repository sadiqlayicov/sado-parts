import { NextRequest, NextResponse } from 'next/server'
import { prisma, resetPrismaClient } from '@/lib/prisma'

// GET - Get all products
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    })
    // images sahəsini array kimi qaytar
    const productsWithImages = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }))
    return NextResponse.json(productsWithImages)
  } catch (error) {
    console.error('Get products error:', error)
    
    // PostgreSQL prepared statement xətası üçün xüsusi handling
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes('prepared statement') || errorMessage.includes('42P05') || errorMessage.includes('26000')) {
        console.log('PostgreSQL prepared statement xətası aşkarlandı, yenidən cəhd edilir...');
        // Qısa müddət gözlə və yenidən cəhd et
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          // Prisma Client-i yenidən başlat
          await resetPrismaClient();
          
          // Qısa müddət gözlə
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' }
          })
          // images sahəsini array kimi qaytar
          const productsWithImages = products.map(product => ({
            ...product,
            images: product.images ? JSON.parse(product.images) : []
          }))
          return NextResponse.json(productsWithImages)
        } catch (retryError) {
          console.error('Retry error:', retryError);
        }
      }
    }
    
    // Xəta zamanı boş array qaytar
    return NextResponse.json([])
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/products called')
    const body = await request.json()
    console.log('Received data:', JSON.stringify(body, null, 2))
    
    const { name, description, price, salePrice, sku, stock, images, categoryId, isActive, isFeatured, artikul, catalogNumber } = body

    console.log('Parsed data:', {
      name, description, price, salePrice, sku, stock, images, categoryId, isActive, isFeatured, artikul, catalogNumber
    })

    // Validation
    if (!name) {
      console.error('Name is required')
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!price) {
      console.error('Price is required')
      return NextResponse.json({ error: 'Price is required' }, { status: 400 })
    }

    console.log('Creating product with data:', {
      name,
      description,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      sku,
      stock: parseInt(stock) || 0,
      images: images ? (Array.isArray(images) ? images : [images]) : [],
      categoryId,
      isActive,
      isFeatured,
      artikul: artikul || null,
      catalogNumber: catalogNumber || null
    })

    const imagesArray = images ? (Array.isArray(images) ? images : [images]) : [];
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        sku,
        stock: parseInt(stock) || 0,
        images: JSON.stringify(imagesArray),
        categoryId,
        isActive,
        isFeatured,
        artikul: artikul || null,
        catalogNumber: catalogNumber || null
      },
      include: { category: true }
    })

    console.log('Created product:', JSON.stringify(product, null, 2))

    // images sahəsini array kimi qaytar
    return NextResponse.json({
      message: 'Məhsul uğurla əlavə olundu',
      product: { ...product, images: imagesArray }
    }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json(
      { error: typeof error === 'object' && error && 'message' in error ? (error as any).message : 'Məhsul əlavə etmə xətası' },
      { status: 500 }
    )
  }
} 