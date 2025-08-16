import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';

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
        // Build a very small PDF invoice for confirmed/delivered statuses
        let attachments: any[] | undefined = undefined;
        if (status === 'confirmed' || status === 'delivered') {
          try {
            const orderRow = await client.query(`SELECT "orderNumber", "totalAmount", "createdAt" FROM orders WHERE id=$1`, [orderId]);
            const rows = await client.query(`SELECT name, sku, quantity, price, "totalPrice" FROM order_items WHERE "orderId"=$1 LIMIT 10`, [orderId]);
            const o = orderRow.rows[0];
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('СЧЕТ-ФАКТУРА', 105, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`№ ${o?.orderNumber || ''} от ${new Date(o?.createdAt || Date.now()).toLocaleDateString('ru-RU')}`, 105, 22, { align: 'center' });
            doc.text(`Статус: ${statusMap[updatedOrder.status] || updatedOrder.status}`, 105, 28, { align: 'center' });
            let y = 36;
            doc.text('Товары:', 14, y); y += 6;
            rows.rows.forEach((r: any, idx: number) => {
              const line = `${idx + 1}. ${r.name} | ${r.sku || ''} | ${r.quantity} шт x ${Number(r.price).toFixed(2)} = ${Number(r.totalPrice).toFixed(2)} ₽`;
              doc.text(line.substring(0, 105), 14, y);
              y += 6;
              if (y > 270) { doc.addPage(); y = 20; }
            });
            y += 4;
            doc.text(`Итого: ${Number(o?.totalAmount || 0).toFixed(2)} ₽`, 14, y);
            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            attachments = [{ filename: `invoice_${o?.orderNumber || 'order'}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }];
          } catch (e) {
            console.error('Inline PDF generation error:', e);
          }
        }

        const mailTasks = [] as Promise<any>[];
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