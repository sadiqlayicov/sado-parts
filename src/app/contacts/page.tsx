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
    <main className="min-h-screen bg-white text-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Контакты</h1>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Контактная информация</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-1">Адрес:</p>
                <p className="text-gray-900 font-medium">{contactInfo.address}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Телефон:</p>
                <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-blue-600 hover:text-blue-700 font-medium">
                  {contactInfo.phone}
                </a>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Email:</p>
                <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:text-blue-700 font-medium">
                  {contactInfo.email}
                </a>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Напишите нам</h2>
            
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.</p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">Ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">Ваше имя</label>
                <input 
                  type="text" 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="Введите ваше имя"
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">Ваш email</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="email@example.com"
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-700">Ваше сообщение</label>
                <textarea 
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none" 
                  rows={4} 
                  placeholder="Введите ваше сообщение"
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full px-6 py-3 rounded-lg font-semibold text-lg transition ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
} 