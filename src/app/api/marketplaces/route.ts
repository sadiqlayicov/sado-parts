import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all marketplaces
export async function GET(request: NextRequest) {
  try {
    const marketplaces = await prisma.marketplace.findMany()
    return NextResponse.json(marketplaces)
  } catch (error) {
    console.error('Get marketplaces error:', error)
    return NextResponse.json(
      { error: 'Marketplaceləri əldə etmə xətası' },
      { status: 500 }
    )
  }
}

// POST - Create new marketplace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, url, isActive } = body

    const marketplace = await prisma.marketplace.create({
      data: {
        name,
        description,
        url,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({
      message: 'Marketplace uğurla əlavə olundu',
      marketplace
    }, { status: 201 })
  } catch (error) {
    console.error('Create marketplace error:', error)
    return NextResponse.json(
      { error: 'Marketplace əlavə etmə xətası' },
      { status: 500 }
    )
  }
} 