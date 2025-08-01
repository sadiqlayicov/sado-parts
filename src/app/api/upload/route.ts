import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Yüklənən fayl üçün unikal ad
  const fileName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadDir, fileName);

  // Qovluğu yaradın (əgər yoxdursa)
  await import('fs/promises').then(fs => fs.mkdir(uploadDir, { recursive: true }));

  // Faylı yazın
  await writeFile(filePath, buffer);

  // Public URL qaytarın
  const url = `/uploads/${fileName}`;
  return NextResponse.json({ url });
} 