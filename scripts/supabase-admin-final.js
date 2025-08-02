const bcrypt = require('bcryptjs');

async function createAdminFinal() {
  try {
    console.log('🔧 Supabase REST API ilə admin yaradılır...');

    // Hash password for admin123
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('✅ Şifrə hash edildi');

    // Supabase REST API endpoint
    const supabaseUrl = 'https://aws-0-eu-north-1.pooler.supabase.co/rest/v1/users';
    const headers = {
      'apikey': 'sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
      'Authorization': 'Bearer sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };

    // Admin data
    const adminData = {
      id: 'admin-' + Date.now(),
      email: 'admin@sado-parts.ru',
      password: hashedPassword,
      name: 'Admin User',
      isAdmin: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('📤 Admin məlumatları göndərilir...');
    console.log('Email:', adminData.email);
    console.log('Şifrə: admin123');

    // Create admin using fetch
    const response = await fetch(supabaseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(adminData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (response.ok) {
      console.log('✅ Admin uğurla yaradıldı!');
      console.log('Admin məlumatları:');
      console.log(`Email: ${adminData.email}`);
      console.log('Şifrə: admin123');
      console.log('Admin paneli: https://sado-parts.vercel.app/login');
    } else {
      const errorText = await response.text();
      console.log('❌ Xəta baş verdi:', response.status, errorText);
      
      // If admin already exists, update password
      if (response.status === 409) {
        console.log('🔄 Admin artıq mövcuddur, şifrə yenilənir...');
        
        const updateResponse = await fetch(`${supabaseUrl}?email=eq.admin@sado-parts.ru`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({
            password: hashedPassword,
            isAdmin: true,
            isApproved: true
          })
        });

        if (updateResponse.ok) {
          console.log('✅ Admin şifrəsi yeniləndi!');
          console.log('Admin məlumatları:');
          console.log(`Email: ${adminData.email}`);
          console.log('Şifrə: admin123');
        } else {
          console.log('❌ Şifrə yenilənmədi:', updateResponse.status);
        }
      }
    }

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  }
}

createAdminFinal(); 