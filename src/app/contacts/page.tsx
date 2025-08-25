'use client';

import { useState, useEffect } from 'react';

export default function ContactsPage() {
  const [contactInfo, setContactInfo] = useState({
    phone: '+7 (495) 123-45-67',
    email: 'info@sado-parts.ru',
    address: 'г. Москва, ул. Примерная, д. 1'
  });

  // Load settings from API with caching
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check if settings are cached
        const cachedSettings = localStorage.getItem('siteSettings');
        if (cachedSettings) {
          const settings = JSON.parse(cachedSettings);
          setContactInfo({
            phone: settings.contactPhone || '+7 (495) 123-45-67',
            email: settings.contactEmail || 'info@sado-parts.ru',
            address: settings.address || 'г. Москва, ул. Примерная, д. 1'
          });
          return;
        }

        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        if (data.success && data.settings) {
          const settings = data.settings;
          setContactInfo({
            phone: settings.contactPhone || '+7 (495) 123-45-67',
            email: settings.contactEmail || 'info@sado-parts.ru',
            address: settings.address || 'г. Москва, ул. Примерная, д. 1'
          });
        }
      } catch (error) {
        console.error('Contacts: Error loading site settings:', error);
      }
    };

    loadSettings();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <h1 className="text-4xl font-bold mb-8 neon-text">Контакты</h1>
      <div className="mb-8">
        <p className="mb-2">Адрес: {contactInfo.address}</p>
        <p className="mb-2">Телефон: <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-cyan-400 hover:underline">{contactInfo.phone}</a></p>
        <p className="mb-2">Email: <a href={`mailto:${contactInfo.email}`} className="text-cyan-400 hover:underline">{contactInfo.email}</a></p>
      </div>
      <form className="flex flex-col gap-4 max-w-xl">
        <input type="text" placeholder="Ваше имя" className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" required />
        <input type="email" placeholder="Ваш email" className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" required />
        <textarea placeholder="Ваше сообщение" className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" rows={4} required />
        <button type="submit" className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition">Отправить</button>
      </form>
    </main>
  );
} 