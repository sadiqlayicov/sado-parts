import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const mode = searchParams.get('mode');

  console.log('1C Exchange GET request:', { type, mode });

  // A. Начало сеанса (Session Start)
  if (type === 'catalog' && mode === 'checkauth') {
    console.log('1C Session start - checkauth');
    
    const response = `success
sessid
${Date.now()}`;

    return new NextResponse(response, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // B. Запрос параметров (Parameters Request)
  if (type === 'catalog' && mode === 'init') {
    console.log('1C Parameters request - init');
    
    const response = `zip=no
file_limit=1048576`;

    return new NextResponse(response, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Default response
  return new NextResponse('success', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const mode = searchParams.get('mode');
  const filename = searchParams.get('filename');

  console.log('1C Exchange POST request:', { type, mode, filename });

  // C. Выгрузка файлов (File Upload)
  if (type === 'catalog' && mode === 'file') {
    console.log('1C File upload:', filename);
    
    // For now, just return success
    return new NextResponse('success', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // D. Пошаговая загрузка данных (Step-by-step data import)
  if (type === 'catalog' && mode === 'import') {
    console.log('1C Data import:', filename);
    
    return new NextResponse('success', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Default response
  return new NextResponse('success', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
