import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Upload endpoint called');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file uploaded');
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
    }

    console.log('File received:', file.name, file.type, file.size);

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Разрешены только изображения JPEG, PNG и WebP' },
        { status: 400 }
      );
    }

    // Проверка размера файла (5MB лимит)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { error: 'Размер файла должен быть менее 5MB' },
        { status: 400 }
      );
    }

    // Конвертация файла в base64 для хранения
    console.log('File validation successful, converting to base64');
    
    try {
      // Конвертация файла в base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      
      // Создание data URL
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      console.log('Successfully converted to base64, size:', base64.length);
      
      return NextResponse.json({
        url: dataUrl,
        success: true,
        message: 'Файл успешно конвертирован в base64'
      });
      
    } catch (conversionError: any) {
      console.error('Base64 conversion failed:', conversionError);
      
      // Fallback к placeholder если конвертация не удалась
      const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9LPC90ZXh0Pjwvc3ZnPg==';
      
      return NextResponse.json({
        url: placeholderUrl,
        success: true,
        message: `Валидация файла успешна (использован placeholder из-за: ${conversionError.message})`
      });
    }

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Внутренняя ошибка сервера: ${error.message}` },
      { status: 500 }
    );
  }
} 