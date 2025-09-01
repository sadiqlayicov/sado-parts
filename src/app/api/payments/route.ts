import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Ensure payments table exists (compatible types)
async function ensurePaymentsTable(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id TEXT,
      user_id TEXT,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'RUB',
      payment_system VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      transaction_id VARCHAR(100),
      payment_data JSONB,
      commission DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      processed_at TIMESTAMP,
      error_message TEXT,
      receipt_image TEXT
    )
  `);
}

// Ödəniş sistemləri konfiqurasiyası (yalnız Bank köçürməsi və P2P)
const PAYMENT_SYSTEMS = {
  bank_transfer: {
    name: 'Банковский перевод',
    icon: '🏛️',
    description: 'Перевод на банковский счет (только для ИНН)',
    commission: 0,
    minAmount: 1000,
    maxAmount: 1000000,
    requiresInn: true
  },
  p2p: {
    name: 'P2P перевод (карта)',
    icon: '💳',
    description: 'Оплата переводом с карты на карту',
    commission: 0,
    minAmount: 10,
    maxAmount: 100000
  }
};

// Bank rekvizitləri - settings-dən alınacaq
async function getBankDetailsFromSettings(client: any) {
  try {
    const result = await client.query(`
      SELECT key, value FROM settings 
      WHERE key IN ('companyName', 'accountNumber', 'bankName', 'bik', 'bankAccountNumber', 'inn', 'kpp', 'companyAddress')
    `);
    
    const settings: any = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });
    
    return {
      name: settings.companyName || 'ООО "Садо-Партс"',
      account: settings.accountNumber || '40702810123456789012',
      bank: settings.bankName || 'ПАО Сбербанк',
      bik: settings.bik || '044525225',
      correspondent: settings.bankAccountNumber || '30101810400000000225',
      inn: settings.inn || '7707083893',
      kpp: settings.kpp || '770701001',
      address: settings.companyAddress || 'г. Москва, ул. Тверская, д. 1, стр. 1'
    };
  } catch (error) {
    console.error('Error getting bank details from settings:', error);
    // Fallback dəyərlər
    return {
      name: 'ООО "Садо-Партс"',
      account: '40702810123456789012',
      bank: 'ПАО Сбербанк',
      bik: '044525225',
      correspondent: '30101810400000000225',
      inn: '7707083893',
      kpp: '770701001',
      address: 'г. Москва, ул. Тверская, д. 1, стр. 1'
    };
  }
}

export async function GET(request: NextRequest) {
  let client: any;
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log('Payment GET request:', { action });

    client = await pool.connect();

    // Ensure payments table exists
    await ensurePaymentsTable(client);

    if (!action) {
      // If no action specified, return all payments (for admin panel)
      return await getPayments(client);
    }

    switch (action) {
      case 'get_systems':
        return await getPaymentSystems();
      case 'get_bank_details':
        return await getBankDetails();
      case 'get_payments':
        return await getPayments(client);
      case 'get_payment':
        const paymentId = searchParams.get('id');
        return await getPayment(client, paymentId);
      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Payment GET error:', error);
    return NextResponse.json(
      { error: `Ошибка платежной системы: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let client: any;
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log('Payment POST request:', { action });

    if (!action) {
      return NextResponse.json(
        { error: 'Требуется параметр action' },
        { status: 400 }
      );
    }

    const body = await request.json();
    client = await pool.connect();

    switch (action) {
      case 'create_payment':
        return await createPayment(client, body);
      case 'process_payment':
        return await processPayment(client, body);
      case 'cancel_payment':
        return await cancelPayment(client, body);
      case 'refund_payment':
        return await refundPayment(client, body);
      case 'upload_receipt':
        return await uploadReceipt(client, body);
      case 'approve_payment':
        return await approvePayment(client, body);
      case 'delete_payment':
        return await deletePayment(client, body);
      case 'bulk_delete_payments':
        return await bulkDeletePayments(client, body);
      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Payment POST error:', error);
    return NextResponse.json(
      { error: `Ошибка платежной системы: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Ödəniş sistemlərini qaytar
async function getPaymentSystems() {
  return NextResponse.json({
    success: true,
    systems: PAYMENT_SYSTEMS
  });
}

// Bank rekvizitlərini qaytar
async function getBankDetails() {
  let client: any;
  
  try {
    client = await pool.connect();
    const bankDetails = await getBankDetailsFromSettings(client);
    
    return NextResponse.json({
      success: true,
      bankDetails: bankDetails
    });
  } catch (error: any) {
    console.error('Error getting bank details:', error);
    return NextResponse.json(
      { error: `Ошибка получения банковских реквизитов: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Ödənişləri al
async function getPayments(client: any) {
  try {
    await ensurePaymentsTable(client);

    const result = await client.query(`
      SELECT 
        p.*,
        o."orderNumber",
        u."firstName",
        u."lastName",
        u.email
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    return NextResponse.json({
      success: true,
      payments: result.rows || []
    });

  } catch (error: any) {
    console.error('Error getting payments:', error);
    return NextResponse.json(
      { error: `Ошибка получения платежей: ${error.message}` },
      { status: 500 }
    );
  }
}

// Tək ödənişi al
async function getPayment(client: any, paymentId: string | null) {
  if (!paymentId) {
    return NextResponse.json(
      { error: 'Требуется ID платежа' },
      { status: 400 }
    );
  }

  try {
    await ensurePaymentsTable(client);
    const result = await client.query(`
      SELECT 
        p.*,
        o."orderNumber",
        u."firstName",
        u."lastName",
        u.email
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [paymentId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Платеж не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error getting payment:', error);
    return NextResponse.json(
      { error: `Ошибка получения платежа: ${error.message}` },
      { status: 500 }
    );
  }
}

// Yeni ödəniş yarat
async function createPayment(client: any, body: any) {
  const { orderId, userId, amount, paymentSystem } = body;

  if (!orderId || !userId || !amount || !paymentSystem) {
    return NextResponse.json(
      { error: 'Требуются orderId, userId, amount, paymentSystem' },
      { status: 400 }
    );
  }

  if (!PAYMENT_SYSTEMS[paymentSystem as keyof typeof PAYMENT_SYSTEMS]) {
    return NextResponse.json(
      { error: 'Неподдерживаемая платежная система' },
      { status: 400 }
    );
  }

  try {
    await ensurePaymentsTable(client);
    const system = PAYMENT_SYSTEMS[paymentSystem as keyof typeof PAYMENT_SYSTEMS];
    
    // Bank köçürməsi üçün INN yoxlaması
    if ('requiresInn' in system && system.requiresInn) {
      const userResult = await client.query(`
        SELECT "inn" FROM users WHERE id = $1
      `, [userId]);
      
      if (userResult.rows.length === 0 || !userResult.rows[0].inn) {
        return NextResponse.json(
          { error: 'Банковский перевод доступен только для клиентов с ИНН' },
          { status: 400 }
        );
      }
    }
    
    const commission = (amount * system.commission) / 100;
    const totalAmount = amount + commission;

    // Ödəniş yarat
    const result = await client.query(`
      INSERT INTO payments (
        order_id, user_id, amount, payment_system, 
        commission, total_amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [orderId, userId, amount, paymentSystem, commission, totalAmount, 'pending']);

    const paymentId = result.rows[0].id;

    // Ödəniş linki yarat
    const paymentUrl = await generatePaymentUrl(paymentId, paymentSystem, totalAmount);

    return NextResponse.json({
      success: true,
      message: 'Платеж успешно создан',
      payment: {
        id: paymentId,
        amount,
        commission,
        totalAmount,
        paymentSystem,
        paymentUrl
      }
    });

  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: `Ошибка создания платежа: ${error.message}` },
      { status: 500 }
    );
  }
}

// Ödənişi emal et
async function processPayment(client: any, body: any) {
  const { paymentId, transactionId, paymentData } = body;

  if (!paymentId || !transactionId) {
    return NextResponse.json(
      { error: 'Требуются paymentId и transactionId' },
      { status: 400 }
    );
  }

  try {
    await ensurePaymentsTable(client);
    // Ödənişi yenilə
    await client.query(`
      UPDATE payments 
      SET 
        status = 'completed',
        transaction_id = $1,
        payment_data = $2,
        processed_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
    `, [transactionId, JSON.stringify(paymentData), paymentId]);

    // Sifarişi yenilə
    await client.query(`
      UPDATE orders 
      SET 
        status = 'confirmed',
        "updatedAt" = NOW()
      WHERE id = (
        SELECT order_id FROM payments WHERE id = $1
      )
    `, [paymentId]);

    // Clear cart for the user related to this payment
    try {
      const orderUser = await client.query(`
        SELECT user_id FROM payments WHERE id = $1
      `, [paymentId]);
      const payUserId = orderUser.rows?.[0]?.user_id;
      if (payUserId) {
        await client.query('DELETE FROM cart_items WHERE "userId" = $1', [payUserId]);
        console.log('Cart cleared for user after payment processed:', payUserId);
      }
    } catch (clearErr) {
      console.error('Error clearing cart after payment processed:', clearErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Платеж успешно обработан'
    });

  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: `Ошибка обработки платежа: ${error.message}` },
      { status: 500 }
    );
  }
}

// Upload bank transfer receipt
async function uploadReceipt(client: any, body: any) {
  const { paymentId, receiptImage } = body;

  if (!paymentId || !receiptImage) {
    return NextResponse.json(
      { error: 'Требуются paymentId и receiptImage (base64 либо URL)' },
      { status: 400 }
    );
  }

  try {
    await client.query(`
      UPDATE payments
      SET payment_data = COALESCE(payment_data, '{}'::jsonb) || jsonb_build_object('receiptImage', $2),
          receipt_image = $2,
          updated_at = NOW()
      WHERE id = $1
    `, [paymentId, receiptImage]);

    return NextResponse.json({ success: true, message: 'Квитанция успешно загружена' });
  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json(
      { error: `Ошибка загрузки квитанции: ${error.message}` },
      { status: 500 }
    );
  }
}

// Approve pending payment (admin)
async function approvePayment(client: any, body: any) {
  const { paymentId, orderId } = body || {};

  try {
    await ensurePaymentsTable(client);

    let targetPaymentId: number | null = null;

    // If paymentId is provided and numeric, use it
    if (paymentId !== undefined && paymentId !== null && !Number.isNaN(Number(paymentId))) {
      targetPaymentId = Number(paymentId);
    }

    // If not provided or not numeric, but orderId present (or paymentId looks like an order id), resolve by order
    if (targetPaymentId === null) {
      const byOrderId = orderId || (typeof paymentId === 'string' ? paymentId : null);
      if (!byOrderId) {
        return NextResponse.json(
          { error: 'Требуется paymentId или orderId' },
          { status: 400 }
        );
      }
      const lookup = await client.query(
        `SELECT id FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [byOrderId]
      );
      if (lookup.rows.length === 0) {
        return NextResponse.json(
          { error: 'Платеж для указанного заказа не найден' },
          { status: 404 }
        );
      }
      targetPaymentId = Number(lookup.rows[0].id);
    }

    // Approve payment
    await client.query(
      `UPDATE payments SET status = 'completed', processed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [targetPaymentId]
    );

    // Update related order to confirmed
    await client.query(
      `UPDATE orders SET status = 'confirmed', "updatedAt" = NOW() WHERE id = (SELECT order_id FROM payments WHERE id = $1)`,
      [targetPaymentId]
    );

    // Clear cart for the user related to this payment
    try {
      const orderUser = await client.query(`SELECT user_id FROM payments WHERE id = $1`, [targetPaymentId]);
      const payUserId = orderUser.rows?.[0]?.user_id;
      if (payUserId) {
        await client.query('DELETE FROM cart_items WHERE "userId" = $1', [payUserId]);
      }
    } catch (clearErr) {
      console.error('Error clearing cart after approve_payment:', clearErr);
    }

    return NextResponse.json({ success: true, message: 'Платеж подтвержден' });
  } catch (error: any) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { error: `Ошибка подтверждения платежа: ${error.message}` },
      { status: 500 }
    );
  }
}

// Ödənişi ləğv et
async function cancelPayment(client: any, body: any) {
  const { paymentId, reason } = body;

  if (!paymentId) {
    return NextResponse.json(
      { error: 'Требуется paymentId' },
      { status: 400 }
    );
  }

  try {
    await client.query(`
      UPDATE payments 
      SET 
        status = 'cancelled',
        error_message = $1,
        updated_at = NOW()
      WHERE id = $2
    `, [reason || 'Отменен пользователем', paymentId]);

    return NextResponse.json({
      success: true,
      message: 'Платеж отменен'
    });

  } catch (error: any) {
    console.error('Error cancelling payment:', error);
    return NextResponse.json(
      { error: `Ошибка отмены платежа: ${error.message}` },
      { status: 500 }
    );
  }
}

// Ödənişi geri qaytar
async function refundPayment(client: any, body: any) {
  const { paymentId, amount, reason } = body;

  if (!paymentId || !amount) {
    return NextResponse.json(
      { error: 'Требуются paymentId и amount' },
      { status: 400 }
    );
  }

  try {
    // Ödənişi yoxla
    const paymentResult = await client.query(`
      SELECT * FROM payments WHERE id = $1
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Платеж не найден' },
        { status: 404 }
      );
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Платеж не может быть возвращен' },
        { status: 400 }
      );
    }

    if (amount > payment.total_amount) {
      return NextResponse.json(
        { error: 'Сумма возврата превышает сумму платежа' },
        { status: 400 }
      );
    }

    // Geri qaytarma yarat
    await client.query(`
      INSERT INTO payments (
        order_id, user_id, amount, payment_system, 
        status, payment_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      payment.order_id,
      payment.user_id,
      -amount,
      payment.payment_system,
      'refunded',
      JSON.stringify({
        originalPaymentId: paymentId,
        reason: reason || 'Возврат средств',
        refundAmount: amount
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Возврат средств успешно создан'
    });

  } catch (error: any) {
    console.error('Error refunding payment:', error);
    return NextResponse.json(
      { error: `Ошибка возврата средств: ${error.message}` },
      { status: 500 }
    );
  }
}

// Ödəniş linki yarat
async function generatePaymentUrl(paymentId: number, paymentSystem: string, amount: number): Promise<string> {
  // Prefer VERCEL_URL if available, otherwise public site URL envs, fallback to localhost
  let baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000');
  // Ensure baseUrl has protocol
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  // Hər ödəniş sistemi üçün fərqli link
  switch (paymentSystem) {
    case 'bank_transfer':
      return `${baseUrl}/payment/bank-transfer/${paymentId}`;
    case 'p2p':
      return `${baseUrl}/payment/p2p/${paymentId}`;
    default:
      return `${baseUrl}/payment/process/${paymentId}`;
  }
}

// Approve payment
async function approvePayment(client: any, body: any) {
  const { paymentId } = body;

  if (!paymentId) {
    return NextResponse.json(
      { error: 'Требуется paymentId' },
      { status: 400 }
    );
  }

  try {
    const result = await client.query(`
      UPDATE payments 
      SET status = 'completed', 
          processed_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [paymentId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Платеж не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Платеж успешно подтвержден',
      payment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { error: `Ошибка подтверждения платежа: ${error.message}` },
      { status: 500 }
    );
  }
}

// Delete payment
async function deletePayment(client: any, body: any) {
  const { paymentId } = body;

  if (!paymentId) {
    return NextResponse.json(
      { error: 'Требуется paymentId' },
      { status: 400 }
    );
  }

  try {
    const result = await client.query(`
      DELETE FROM payments 
      WHERE id = $1
      RETURNING *
    `, [paymentId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Платеж не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Платеж успешно удален'
    });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: `Ошибка удаления платежа: ${error.message}` },
      { status: 500 }
    );
  }
}

// Bulk delete payments
async function bulkDeletePayments(client: any, body: any) {
  const { paymentIds } = body;

  if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
    return NextResponse.json(
      { error: 'Требуется массив paymentIds' },
      { status: 400 }
    );
  }

  try {
    const result = await client.query(`
      DELETE FROM payments 
      WHERE id = ANY($1)
      RETURNING id
    `, [paymentIds]);

    return NextResponse.json({
      success: true,
      message: `${result.rows.length} платежей успешно удалены`,
      deletedCount: result.rows.length
    });
  } catch (error: any) {
    console.error('Error bulk deleting payments:', error);
    return NextResponse.json(
      { error: `Ошибка массового удаления платежей: ${error.message}` },
      { status: 500 }
    );
  }
}
