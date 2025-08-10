"use client";
import { useEffect, useState } from "react";

export default function AdminDatabasePage() {
  const [database, setDatabase] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div style={{ maxWidth: '100%', margin: "40px auto", background: "#232b3b", color: "#fff", padding: 24, borderRadius: 10, boxShadow: '0 4px 24px #0002' }}>
      <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: 'left', letterSpacing: 1 }}>База данных</h2>
      
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h3 style={{ fontSize: 20, marginBottom: 16 }}>Функция базы данных</h3>
          <p style={{ color: '#888', marginBottom: 24 }}>Функция базы данных находится в разработке</p>
          <div style={{ 
            background: '#1a2233', 
            padding: '20px', 
            borderRadius: 8, 
            border: '1px solid #333',
            display: 'inline-block'
          }}>
            <p style={{ margin: 0, color: '#0af' }}>Скоро будет доступно</p>
          </div>
        </div>
      )}
    </div>
  );
}
