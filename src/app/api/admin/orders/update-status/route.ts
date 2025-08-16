import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// Ensure Node.js runtime and enough time for headless Chrome on Vercel
export const runtime = 'nodejs';
export const maxDuration = 60;

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
        // Build a PDF invoice mirroring print layout for confirmed/delivered statuses
        let attachments: any[] | undefined = undefined;
        if (status === 'confirmed' || status === 'delivered') {
          try {
            const orderRow = await client.query(`SELECT "orderNumber", "totalAmount", "createdAt" FROM orders WHERE id=$1`, [orderId]);
            const rows = await client.query(`SELECT name, sku, quantity, price, "totalPrice" FROM order_items WHERE "orderId"=$1 LIMIT 10`, [orderId]);
            const o = orderRow.rows[0];

            // Build HTML identical to print version
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
              <style>
                @page { size: A4; margin: 1.5cm; }
                body { font-family: 'Times New Roman', serif; font-size: 12px; color: #000; }
                .header{ text-align:center; margin-bottom:30px; padding-bottom:20px; }
                table{ width:100%; border-collapse:collapse; margin:20px 0; font-size:11px; }
                th,td{ border:1px solid #000; padding:6px; text-align:left; vertical-align:top; }
                th{ background:#f0f0f0; text-align:center; font-weight:bold; }
                .total-row{ display:flex; justify-content:space-between; margin-bottom:5px; padding:5px 0; }
                .total-row.final{ font-weight:bold; border-top:2px solid #000; padding-top:10px; margin-top:10px; }
                .signatures{ display:flex; justify-content:space-between; margin-top:50px; }
                .signature-box{ text-align:center; width:45%; }
                .signature-line{ border-bottom:1px solid #000; width:200px; margin:20px auto 5px; }
              </style>
            </head><body>
              <div class="header">
                <div style="font-size:24px; font-weight:bold;">СЧЕТ-ФАКТУРА</div>
                <div>№ ${o?.orderNumber || ''}</div>
                <div>от ${new Date(o?.createdAt || Date.now()).toLocaleDateString('ru-RU')}</div>
              </div>
              <table>
                <thead><tr><th>Поставщик:</th><th>Покупатель:</th></tr></thead>
                <tbody><tr><td>
                  <div><strong>${process.env.COMPANY_NAME || 'ООО "Садо-Партс"'}</strong></div>
                  <div>${process.env.COMPANY_ADDRESS || ''}</div>
                  <div>ИНН: ${process.env.COMPANY_INN || ''}</div>
                  <div>КПП: ${process.env.COMPANY_KPP || ''}</div>
                  <div>БИК: ${process.env.COMPANY_BIK || ''}</div>
                  <div>Счет №: ${process.env.COMPANY_ACCOUNT || ''}</div>
                  <div>Банк: ${process.env.COMPANY_BANK || ''}</div>
                </td><td>
                  <div><strong>${(customer.firstName || '') + ' ' + (customer.lastName || '')}</strong></div>
                  <div>Email: ${customer.email || ''}</div>
                </td></tr></tbody>
              </table>
              <table>
                <thead><tr><th>№</th><th>Товар (Услуга)</th><th>Код</th><th>Кол-во</th><th>Ед.</th><th>Цена</th><th>Сумма</th></tr></thead>
                <tbody>
                ${rows.rows.map((r:any, idx:number)=>`
                  <tr><td>${idx+1}</td><td>${r.name}</td><td>${r.sku||''}</td><td>${r.quantity}</td><td>шт.</td><td>${Number(r.price).toFixed(2)} ₽</td><td>${Number(r.totalPrice).toFixed(2)} ₽</td></tr>
                `).join('')}
                </tbody>
              </table>
              <div class="total-row"><span><strong>Итого:</strong></span><span>${Number(o?.totalAmount||0).toFixed(2)} ₽</span></div>
              <div class="total-row"><span>Без налога (НДС):</span><span>${Number(o?.totalAmount||0).toFixed(2)} ₽</span></div>
              <div class="total-row final"><span><strong>Всего к оплате:</strong></span><span><strong>${Number(o?.totalAmount||0).toFixed(2)} ₽</strong></span></div>
              <div class="signatures"><div class="signature-box"><p><strong>Руководитель</strong></p><div class="signature-line"></div></div><div class="signature-box"><p><strong>Бухгалтер</strong></p><div class="signature-line"></div></div></div>
            </body></html>`;

            // Launch headless chrome on Vercel
            const executablePath = await chromium.executablePath();
            const browser = await puppeteer.launch({
              args: chromium.args,
              defaultViewport: chromium.defaultViewport,
              executablePath,
              headless: chromium.headless,
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'load' });
            await page.emulateMediaType('screen');
            // Ensure a default font for Cyrillic support
            await page.addStyleTag({ content: '@font-face{font-family:system-ui;src:local("Arial"), local("Tahoma");} body{font-family:system-ui,"Arial",sans-serif;}' });

            const pdfBuffer = await page.pdf({
              format: 'A4',
              printBackground: true,
              preferCSSPageSize: true,
              margin: { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' }
            });
            await browser.close();
            attachments = [{ filename: `invoice_${o?.orderNumber || 'order'}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }];
          } catch (e) {
            console.error('Inline PDF generation error:', e);
            // Fallback to simple jsPDF to ensure attachment is present
            try {
              const orderRow2 = await client.query(`SELECT o."orderNumber", o."totalAmount", o."createdAt", u.email, u."firstName", u."lastName", u.inn, u.country, u.city, u.address FROM orders o LEFT JOIN users u ON u.id=o."userId" WHERE o.id=$1`, [orderId]);
              const rows2 = await client.query(`SELECT name, sku, quantity, price, "totalPrice" FROM order_items WHERE "orderId"=$1 ORDER BY created_at ASC`, [orderId]);
              const o2 = orderRow2.rows[0];
              const doc = new jsPDF();
              doc.setFontSize(16);
              doc.text('СЧЕТ-ФАКТУРА', 105, 15, { align: 'center' });
              doc.setFontSize(10);
              doc.text(`№ ${o2?.orderNumber || ''} от ${new Date(o2?.createdAt || Date.now()).toLocaleDateString('ru-RU')}`, 105, 22, { align: 'center' });
              let y = 32;
              rows2.rows.forEach((r:any, i:number) => {
                const line = `${i+1}. ${r.name} | ${r.sku||''} | ${r.quantity} x ${Number(r.price).toFixed(2)} = ${Number(r.totalPrice).toFixed(2)} ₽`;
                doc.text(line.substring(0, 110), 14, y);
                y += 6; if (y > 280) { doc.addPage(); y = 20; }
              });
              y += 6;
              doc.text(`Итого: ${Number(o2?.totalAmount||0).toFixed(2)} ₽`, 14, y);
              const buf = Buffer.from(doc.output('arraybuffer'));
              attachments = [{ filename: `invoice_${o2?.orderNumber || 'order'}.pdf`, content: buf, contentType: 'application/pdf' }];
            } catch (fErr) {
              console.error('jsPDF fallback generation error:', fErr);
            }
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