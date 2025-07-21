import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Sadə login üçün istifadəçi adı və şifrə (realda .env-dən alınmalıdır)
const AUTH_USER = '1cuser'
const AUTH_PASS = '1cpass'

function checkAuth(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Basic ')) return false
  const base64 = auth.replace('Basic ', '')
  const [user, pass] = Buffer.from(base64, 'base64').toString().split(':')
  return user === AUTH_USER && pass === AUTH_PASS
}

// GET və POST - 1C Exchange əsas protokol
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic' } })
  }
  // 1C status yoxlaması və ya fayl sorğusu üçün istifadə edir
  const mode = request.nextUrl.searchParams.get('mode')
  if (mode === 'checkauth') {
    // 1C üçün login cavabı
    return new NextResponse('success\n1c_session\nSESSIONID123', { status: 200 })
  }
  if (mode === 'init') {
    // Fayl yükləmə üçün 1C-yə cavab
    return new NextResponse('zip=no\nfile_limit=10485760', { status: 200 })
  }
  if (mode === 'file') {
    // 1C-dən fayl istəyi (məsələn, məhsul və ya sifariş məlumatı)
    // Burada fayl göndərmək və ya qəbul etmək üçün kod əlavə oluna bilər
    return new NextResponse('success', { status: 200 })
  }
  if (mode === 'import') {
    // 1C-dən məlumat idxalı üçün istifadə olunur
    return new NextResponse('success', { status: 200 })
  }
  return new NextResponse('unknown mode', { status: 400 })
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic' } })
  }
  const mode = request.nextUrl.searchParams.get('mode')
  if (mode === 'file') {
    // Fayl yükləmə üçün body-dən faylı oxu və saxla
    const fileName = request.nextUrl.searchParams.get('filename') || '1c-upload.xml'
    const uploadDir = path.join(process.cwd(), 'public', '1c-uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, fileName)
    const buffer = Buffer.from(await request.arrayBuffer())
    await fs.writeFile(filePath, buffer)
    return new NextResponse('success', { status: 200 })
  }
  if (mode === 'import') {
    // Fayl yükləndikdən sonra 1C məlumatlarını emal et
    // Burada faylın parsinqi və DB-yə yazılması üçün kod əlavə oluna bilər
    return new NextResponse('success', { status: 200 })
  }
  return new NextResponse('unknown mode', { status: 400 })
} 