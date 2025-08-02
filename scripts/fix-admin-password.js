const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
  try {
    console.log('🔧 Admin şifrəsi düzəldilir...');

    // Hash password for admin123
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('✅ Şifrə hash edildi');
    console.log('Hash:', hashedPassword);

    // Vercel API endpoint
    const vercelUrl = 'https://sado-parts.vercel.app/api/setup-admin';
    const headers = {
      'Content-Type': 'application/json'
    };

    // Admin data
    const adminData = {
      email: 'admin@sado-parts.ru',
      password: 'admin123'
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
      console.log('✅ Admin uğurla yaradıldı/yeniləndi!');
      console.log('Response:', result);
      
      // Test login
      console.log('\n🧪 Login test edilir...');
      const loginResponse = await fetch('https://sado-parts.vercel.app/api/auth/login-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData)
      });
      
      console.log('Login status:', loginResponse.status);
      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        console.log('✅ Login uğurlu!');
        console.log('Login response:', loginResult);
      } else {
        const errorText = await loginResponse.text();
        console.log('❌ Login xətası:', errorText);
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Admin yaratma xətası:', response.status, errorText);
    }

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  }
}

fixAdminPassword(); 