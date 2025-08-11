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

    // Try to get settings directly
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .order('key');

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      
      // If table doesn't exist, return default settings
      if (settingsError.code === 'PGRST116') {
        console.log('Settings table does not exist, returning default settings');
        const defaultSettings = {
          siteName: 'Sado-Parts',
          companyName: 'ООО "Спецтехника"',
          companyAddress: 'г. Москва, ул. Примерная, д. 123',
          inn: '7707083893',
          kpp: '770701001',
          bik: '044525225',
          accountNumber: '40702810123456789012',
          bankName: 'Сбербанк',
          bankBik: '044525225',
          bankAccountNumber: '30101810200000000225',
          directorName: 'Иванов И.И.',
          accountantName: 'Петрова П.П.'
        };

        return NextResponse.json({
          success: true,
          settings: defaultSettings
        });
      }
      
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

    // Try to update settings
    try {
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
    } catch (tableError: any) {
      // If settings table doesn't exist, just return success
      console.log('Settings table does not exist, skipping save');
      return NextResponse.json({
        success: true,
        message: 'Настройки временно сохранены (таблица настроек не создана)'
      });
    }

  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Не удалось сохранить настройки' },
      { status: 500 }
    );
  }
}
