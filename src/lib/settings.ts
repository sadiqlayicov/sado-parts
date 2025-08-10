// Settings utility functions
let cachedSettings: any = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get settings from cache or fetch from API
 */
export async function getSettings() {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - lastFetch) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const response = await fetch('/api/admin/settings', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      cachedSettings = data.settings;
      lastFetch = now;
      return data.settings;
    } else {
      throw new Error(data.error || 'Failed to fetch settings');
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return cached settings if available, otherwise return defaults
    return cachedSettings || getDefaultSettings();
  }
}

/**
 * Get a specific setting value
 */
export async function getSetting(key: string, defaultValue: string = '') {
  const settings = await getSettings();
  return settings[key] || defaultValue;
}

/**
 * Clear settings cache (useful after updates)
 */
export function clearSettingsCache() {
  cachedSettings = null;
  lastFetch = 0;
}

/**
 * Get default settings
 */
export function getDefaultSettings() {
  return {
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
}

/**
 * Update settings and clear cache
 */
export async function updateSettings(newSettings: any) {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings: newSettings }),
    });

    const data = await response.json();
    
    if (data.success) {
      clearSettingsCache(); // Clear cache so next fetch gets fresh data
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}
