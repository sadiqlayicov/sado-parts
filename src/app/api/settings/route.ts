import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all settings
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.setting.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Ayarları əldə etmə xətası' },
      { status: 500 }
    )
  }
}

// POST - Create new setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, description } = body
    const setting = await prisma.setting.create({
      data: { key, value, description }
    })
    return NextResponse.json({
      message: 'Ayar uğurla əlavə olundu',
      setting
    }, { status: 201 })
  } catch (error) {
    console.error('Create setting error:', error)
    return NextResponse.json(
      { error: 'Ayar əlavə etmə xətası' },
      { status: 500 }
    )
  }
}

// PUT - Update setting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, description } = body
    const setting = await prisma.setting.update({
      where: { key },
      data: { value, description }
    })
    return NextResponse.json({
      message: 'Ayar uğurla yeniləndi',
      setting
    })
  } catch (error) {
    console.error('Update setting error:', error)
    return NextResponse.json(
      { error: 'Ayar yeniləmə xətası' },
      { status: 500 }
    )
  }
}

// DELETE - Delete setting
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { key } = body
    await prisma.setting.delete({
      where: { key }
    })
    return NextResponse.json({
      message: 'Ayar uğurla silindi'
    })
  } catch (error) {
    console.error('Delete setting error:', error)
    return NextResponse.json(
      { error: 'Ayar silmə xətası' },
      { status: 500 }
    )
  }
} 