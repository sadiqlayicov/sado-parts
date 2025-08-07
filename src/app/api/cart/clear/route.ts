import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    await client.connect();

    // Səbətdəki bütün məhsulları sil
    const result = await client.query(
      'DELETE FROM cart_items WHERE "userId" = $1',
      [userId]
    );

    console.log(`Səbət təmizləndi: ${result.rowCount} məhsul silindi`);

    return NextResponse.json({
      success: true,
      message: 'Səbət uğurla təmizləndi',
      deletedCount: result.rowCount
    });

  } catch (error) {
    console.error('Səbət təmizləmə xətası:', error);
    return NextResponse.json(
      { error: 'Səbəti təmizləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
