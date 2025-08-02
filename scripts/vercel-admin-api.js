const bcrypt = require('bcryptjs');

async function createAdminViaVercel() {
  try {
    console.log('🔧 Vercel API ilə admin yaradılır...');

    // Hash password for admin123
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('✅ Şifrə hash edildi');

    // Vercel API endpoint
    const vercelUrl = 'https://sado-parts.vercel.app/api/setup-admin';
    const headers = {
      'Content-Type': 'application/json'
    };

    // Admin data
    const adminData = {
      email: 'admin@sado-parts.ru',
      password: 'admin123',
      name: 'Admin User'
    };

    console.log('📤 Admin məlumatları Vercel API-yə göndərilir...');
    console.log('Email:', adminData.email);
    console.log('Şifrə: admin123');

    // Create admin using Vercel API
    const response = await fetch(vercelUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(adminData)
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Admin uğurla yaradıldı!');
      console.log('Response:', result);
      console.log('Admin məlumatları:');
      console.log(`Email: ${adminData.email}`);
      console.log('Şifrə: admin123');
      console.log('Admin paneli: https://sado-parts.vercel.app/login');
    } else {
      const errorText = await response.text();
      console.log('❌ Xəta baş verdi:', response.status, errorText);
    }

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  }
}

createAdminViaVercel(); 