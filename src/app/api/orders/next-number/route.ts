import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function GET(request: NextRequest) {
  let client: any;
  
  try {
    client = await pool.connect();
    
    // Get the highest order number from the database
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
      // Extract the number part (after "BP")
      const numberPart = lastOrderNumber.substring(2);
      nextNumber = parseInt(numberPart) + 1;
    }
    
    // Format the next order number as BP0000001, BP0000002, etc.
    const nextOrderNumber = `BP${nextNumber.toString().padStart(7, '0')}`;
    
    return NextResponse.json({
      success: true,
      nextOrderNumber: nextOrderNumber,
      nextNumber: nextNumber
    });
    
  } catch (error: any) {
    console.error('Error getting next order number:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении следующего номера заказа' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
