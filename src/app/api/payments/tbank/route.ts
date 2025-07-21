import { NextRequest, NextResponse } from 'next/server'

// Demo/mock T-Bank ödəniş yaratmaq (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency, customer } = body;
    // Demo/mock cavab (realda burada T-Bank API-ə sorğu göndəriləcək)
    return NextResponse.json({
      paymentUrl: `https://tbank.example.com/pay/mock-${orderId}`,
      paymentId: `TBANK-MOCK-${orderId}`,
      status: 'pending'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'T-Bank ödənişi yaratmaq mümkün olmadı.' }, { status: 500 });
  }
}

// Demo/mock T-Bank ödəniş statusunu yoxlamaq (GET)
export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get('paymentId');
    // Demo/mock status (realda burada T-Bank API-ə status sorğusu göndəriləcək)
    // Status random qaytarılır: paid, pending, failed
    const statuses = ['paid', 'pending', 'failed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    return NextResponse.json({
      paymentId,
      status
    });
  } catch (error) {
    return NextResponse.json({ error: 'T-Bank status yoxlanılmadı.' }, { status: 500 });
  }
}

// Demo/mock T-Bank webhook/callback (POST)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // Burada sifarişin statusunu DB-də yeniləmək üçün kod əlavə oluna bilər
    // Demo olaraq sadəcə məlumatı qaytarır
    return NextResponse.json({
      message: 'Webhook qəbul olundu',
      data: body
    });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook qəbul olunmadı.' }, { status: 500 });
  }
} 