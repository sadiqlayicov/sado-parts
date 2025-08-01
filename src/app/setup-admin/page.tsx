'use client';
import { useState } from 'react';

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [adminInfo, setAdminInfo] = useState<any>(null);

  const handleSetupAdmin = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/create-admin-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setAdminInfo(data.admin);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#1a2233',
      color: '#fff',
      padding: '20px'
    }}>
      <div style={{ 
        background: '#232b3b', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Admin Setup
        </h1>
        
        {message && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1rem', 
            borderRadius: '4px',
            background: message.includes('✅') ? '#4caf50' : '#f44336'
          }}>
            {message}
          </div>
        )}

        {adminInfo && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1rem', 
            borderRadius: '4px',
            background: '#2196f3',
            border: '1px solid #1976d2'
          }}>
            <h3>Admin Məlumatları:</h3>
            <p><strong>Email:</strong> {adminInfo.email}</p>
            <p><strong>Şifrə:</strong> admin123</p>
            <p><strong>Ad:</strong> {adminInfo.firstName} {adminInfo.lastName}</p>
            <p><strong>Rol:</strong> {adminInfo.role}</p>
          </div>
        )}

        <button
          onClick={handleSetupAdmin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            background: '#0af',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Admin Yaradılır...' : 'Admin Yarat'}
        </button>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#ccc' }}>
          <p>Admin yaradıldıqdan sonra bu məlumatlarla daxil ola bilərsiniz:</p>
          <p><strong>Email:</strong> admin@sado-parts.ru</p>
          <p><strong>Şifrə:</strong> admin123</p>
          <br />
          <p>Admin panelinə keçmək üçün:</p>
          <a 
            href="/admin" 
            style={{
              color: '#0af',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            /admin
          </a>
        </div>
      </div>
    </div>
  );
} 