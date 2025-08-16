import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { generateInvoicePdf } from '@/app/api/utils/pdf';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function POST(request: NextRequest) {
  let client: any;
  
  try {
    const { orderId, status } = await request.json();
    
    console.log('POST /api/admin/orders/update-status called with:', { orderId, status });

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Требуется ID заказа и статус' },
        { status: 400 }
      );
    }

    // Validate status - include new statuses from the order system
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Недействительный статус' },
        { status: 400 }
      );
    }

    client = await pool.connect();
    
    // Update order status
    const result = await client.query(
      `UPDATE orders 
       SET status = $1, "updatedAt" = NOW() 
       WHERE id = $2 
       RETURNING id, "orderNumber", status`,
      [status, orderId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    const updatedOrder = result.rows[0];
    console.log('Order status updated:', updatedOrder);

    // Fetch user email for notifications
    const userRes = await client.query(
      `SELECT u.email, u."firstName", u."lastName" FROM orders o LEFT JOIN users u ON o."userId" = u.id WHERE o.id = $1`,
      [orderId]
    );
    const customer = userRes.rows[0] || {};

    // Prepare mail transporter (use SMTP envs)
    const smtpHost = process.env.SMTP_HOST as string;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER as string;
    const smtpPass = process.env.SMTP_PASS as string;
    const adminEmail = process.env.ADMIN_EMAIL || customer.email || 'admin@example.com';

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      const statusMap: Record<string, string> = {
        pending: 'В ожидании',
        confirmed: 'Подтвержден',
        processing: 'В обработке',
        shipped: 'Отправлен',
        delivered: 'Доставлен',
        cancelled: 'Отменен'
      };

      const subject = `Заказ #${updatedOrder.orderNumber}: статус изменен на "${statusMap[updatedOrder.status] || updatedOrder.status}"`;
      const html = `
        <p>Здравствуйте${customer.firstName ? ', ' + customer.firstName : ''}!</p>
        <p>Статус вашего заказа <strong>#${updatedOrder.orderNumber}</strong> изменен на <strong>${statusMap[updatedOrder.status] || updatedOrder.status}</strong>.</p>
        <p>Если это были вы — ничего делать не нужно. В ином случае свяжитесь с поддержкой.</p>
        <p>С уважением, Bilal-Parts</p>
      `;

      const adminHtml = `
        <p>Статус заказа <strong>#${updatedOrder.orderNumber}</strong> изменен на <strong>${statusMap[updatedOrder.status] || updatedOrder.status}</strong>.</p>
      `;

      try {
        const mailTasks = [] as Promise<any>[];
        // Try attach invoice PDF when status becomes confirmed or delivered
        let attachments: any[] | undefined;
        if (status === 'confirmed' || status === 'delivered') {
          try {
            const supRes = await client.query(`
              SELECT key, value FROM settings WHERE key IN ('companyName','companyAddress','inn','kpp','bik','accountNumber','bankName','bankAccountNumber')
            `);
            const settings: any = {};
            for (const r of supRes.rows) settings[r.key] = r.value;
            const itemsRes = await client.query(`SELECT name, sku, quantity, price, "totalPrice" FROM order_items WHERE "orderId" = $1`, [orderId]);
            const pdfBytes = await generateInvoicePdf({
              order: {
                orderNumber: updatedOrder.orderNumber,
                createdAt: new Date().toISOString(),
                totalAmount: Number((await client.query('SELECT "totalAmount" FROM orders WHERE id=$1',[orderId])).rows[0]?.totalAmount || 0),
                items: itemsRes.rows.map((r:any)=>({ name: r.name, sku: r.sku, quantity: Number(r.quantity), price: Number(r.price), totalPrice: Number(r.totalPrice) }))
              },
              supplier: {
                companyName: settings.companyName || 'ООО "Садо-Партс"',
                companyAddress: settings.companyAddress || '',
                inn: settings.inn || '',
                kpp: settings.kpp || '',
                bik: settings.bik || '',
                accountNumber: settings.accountNumber || '',
                bankName: settings.bankName || '',
                bankBik: settings.bik || '',
                bankAccountNumber: settings.bankAccountNumber || ''
              },
              customer: {
                name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Клиент',
                email: customer.email || undefined,
              },
            });
            attachments = [{ filename: `invoice_${updatedOrder.orderNumber}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }];
          } catch (e) {
            console.error('PDF generate error:', e);
          }
        }

        if (customer.email) {
          mailTasks.push(transporter.sendMail({ from: smtpUser, to: customer.email, subject, html, attachments }));
        }
        mailTasks.push(transporter.sendMail({ from: smtpUser, to: adminEmail, subject: `[ADMIN] ${subject}`, html: adminHtml, attachments }));
        await Promise.all(mailTasks);
      } catch (mailErr) {
        console.error('Mail send error:', mailErr);
      }
    } else {
      console.warn('SMTP envs not configured; skipping email notifications');
    }

    // Optional: generate and email invoice PDF here in future

    return NextResponse.json({
      success: true,
      message: 'Статус заказа успешно обновлен',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status
      }
    });

  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при обновлении статуса' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 