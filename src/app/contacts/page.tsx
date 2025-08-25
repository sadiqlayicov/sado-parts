'use client';

import { useState, useEffect } from 'react';

export default function ContactsPage() {
  const [contactInfo, setContactInfo] = useState({
    phone: '+7 (495) 123-45-67',
    email: 'info@sado-parts.ru',
    address: 'г. Москва, ул. Примерная, д. 1'
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          toEmail: contactInfo.email
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <h1 className="text-4xl font-bold mb-8 neon-text">Контакты</h1>
      <div className="mb-8">
        <p className="mb-2">Адрес: {contactInfo.address}</p>
        <p className="mb-2">Телефон: <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-cyan-400 hover:underline">{contactInfo.phone}</a></p>
        <p className="mb-2">Email: <a href={`mailto:${contactInfo.email}`} className="text-cyan-400 hover:underline">{contactInfo.email}</a></p>
      </div>
      
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-600 rounded-lg text-white">
          Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-600 rounded-lg text-white">
          Ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
        <input 
          type="text" 
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ваше имя" 
          className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" 
          required 
        />
        <input 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Ваш email" 
          className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" 
          required 
        />
        <textarea 
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          placeholder="Ваше сообщение" 
          className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" 
          rows={4} 
          required 
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition ${
            isSubmitting 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-cyan-500 hover:bg-cyan-600'
          }`}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </main>
  );
} 