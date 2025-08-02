const bcrypt = require('bcryptjs');

async function createSupabaseAdmin() {
  try {
    console.log('🔧 Supabase API ilə admin yaradılır...');

    // Hash password for admin123
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('✅ Şifrə hash edildi');

    // Supabase API endpoint və headers
    const supabaseUrl = 'https://aws-0-eu-north-1.pooler.supabase.co/rest/v1/users';
    const headers = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cy0wLWV1LW5vcnRoLTEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU0MTQ3NTMwLCJleHAiOjIwNzAwNzM1MzB9.8Qv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS8v.m',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cy0wLWV1LW5vcnRoLTEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU0MTQ3NTMwLCJleHAiOjIwNzAwNzM1MzB9.8Qv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS8v.m',
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

    // Fetch API ilə admin yarad
    const response = await fetch(supabaseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(adminData)
    });

    if (response.ok) {
      console.log('✅ Admin uğurla yaradıldı!');
      console.log('Admin məlumatları:');
      console.log(`Email: ${adminData.email}`);
      console.log('Şifrə: admin123');
      console.log('Admin paneli: https://sado-parts.vercel.app/admin');
    } else {
      const errorText = await response.text();
      console.log('❌ Xəta baş verdi:', response.status, errorText);
      
      // Əgər admin artıq varsa, şifrəsini yenilə
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

createSupabaseAdmin(); 