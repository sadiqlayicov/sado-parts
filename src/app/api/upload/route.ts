import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return Response.json(
        { error: 'Şəkil faylı tələb olunur' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return Response.json(
        { error: 'Yalnız şəkil faylları qəbul edilir' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return Response.json(
        { error: 'Şəkil ölçüsü 5MB-dan çox ola bilməz' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename with sanitized extension
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const rawExtension = (file.name.split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '')
    const extension = rawExtension.slice(0, 10)
    const filename = `${timestamp}-${randomString}.${extension}`
    
    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadsDir, filename)
    
    await writeFile(filepath, buffer)

    // Return the URL
    const url = `/uploads/${filename}`

    return Response.json({ 
      success: true,
      url,
      filename 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { error: 'Şəkil yüklənərkən xəta baş verdi' },
      { status: 500 }
    )
  }
} 