import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

async function ensureSettingsTable(client: any) {
  const tableExists = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'settings'
    );
  `);

  if (!tableExists.rows[0].exists) {
    await client.query(`
      CREATE TABLE settings (
        id VARCHAR(255) PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
  }
}

export async function GET() {
  return withConnection(async (client) => {
    await ensureSettingsTable(client);

    const result = await client.query('SELECT key, value FROM settings');

    const settings: any = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({ success: true, settings });
  }, 'GET /api/admin/settings');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { settings } = body;

  if (!settings || typeof settings !== 'object') {
    return NextResponse.json(
      { success: false, error: 'Неверные данные настроек' },
      { status: 400 }
    );
  }

  return withConnection(async (client) => {
    await ensureSettingsTable(client);

    for (const [key, value] of Object.entries(settings)) {
      await client.query(`
        INSERT INTO settings (id, key, value, "updatedAt")
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = $3, "updatedAt" = NOW()
      `, [`setting_${key}`, key, value]);
    }

    return NextResponse.json({
      success: true,
      message: 'Настройки успешно сохранены',
      savedSettings: settings
    });
  }, 'POST /api/admin/settings');
}
