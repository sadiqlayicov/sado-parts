import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  return withConnection(async (client) => {
    const result = await client.query(`
      SELECT "orderNumber"
      FROM orders
      WHERE "orderNumber" LIKE 'BP%'
      ORDER BY CAST(SUBSTRING("orderNumber" FROM 3) AS INTEGER) DESC
      LIMIT 1
    `);

    let nextNumber = 1;

    if (result.rows.length > 0) {
      const lastOrderNumber = result.rows[0].orderNumber;
      const numberPart = lastOrderNumber.substring(2);
      nextNumber = parseInt(numberPart) + 1;
    }

    const nextOrderNumber = `BP${nextNumber.toString().padStart(7, '0')}`;

    return NextResponse.json({
      success: true,
      nextOrderNumber,
      nextNumber
    });
  }, 'GET /api/orders/next-number');
}
