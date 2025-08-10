import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    // Check if settings table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'settings')
      .single();

    if (tableError || !tableCheck) {
      console.log('Settings table does not exist, creating...');
      
      // Create settings table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS settings (
            id VARCHAR(255) PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            value TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      });

      if (createError) {
        console.error('Error creating settings table:', createError);
        return NextResponse.json(
          { error: 'Failed to create settings table' },
          { status: 500 }
        );
      }
      
      // Insert default settings
      const defaultSettings = [
        { key: 'siteName', value: 'Sado-Parts' },
        { key: 'companyName', value: 'ООО "Спецтехника"' },
        { key: 'companyAddress', value: 'г. Москва, ул. Примерная, д. 123' },
        { key: 'inn', value: '7707083893' },
        { key: 'kpp', value: '770701001' },
        { key: 'bik', value: '044525225' },
        { key: 'accountNumber', value: '40702810123456789012' },
        { key: 'bankName', value: 'Сбербанк' },
        { key: 'bankBik', value: '044525225' },
        { key: 'bankAccountNumber', value: '30101810200000000225' },
        { key: 'directorName', value: 'Иванов И.И.' },
        { key: 'accountantName', value: 'Петрова П.П.' }
      ];

      for (const setting of defaultSettings) {
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            id: `setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            key: setting.key,
            value: setting.value
          });

        if (insertError) {
          console.error('Error inserting default setting:', insertError);
        }
      }
      
      console.log('Settings table created with default values');
    }

    // Get all settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .order('key');

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    const settings: { [key: string]: string } = {};
    settingsData?.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Не удалось получить настройки' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Неверные данные настроек' },
        { status: 400 }
      );
    }

    // Check if settings table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'settings')
      .single();
    
    if (tableError || !tableCheck) {
      console.log('Creating settings table...');
      
      // Create settings table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS settings (
            id VARCHAR(255) PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            value TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      });

      if (createError) {
        console.error('Error creating settings table:', createError);
        return NextResponse.json(
          { error: 'Failed to create settings table' },
          { status: 500 }
        );
      }
    }

    // Update or insert settings
    for (const [key, value] of Object.entries(settings)) {
      const settingId = `setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: upsertError } = await supabase
        .from('settings')
        .upsert({
          id: settingId,
          key: key,
          value: value as string,
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (upsertError) {
        console.error(`Error upserting setting ${key}:`, upsertError);
      }
    }

    console.log('Settings updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Настройки успешно сохранены'
    });

  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Не удалось сохранить настройки' },
      { status: 500 }
    );
  }
}
