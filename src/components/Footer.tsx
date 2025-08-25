'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaLinkedin, FaPaperPlane, FaQuestion } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function Footer() {
  const { t } = useTranslation();
  const [contactInfo, setContactInfo] = useState({
    address: 'Bakı şəhəri, Yasamal rayonu'
  });

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Footer: Loading site settings...');
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        console.log('Footer: Settings response:', data);
        
        if (data.success && data.settings) {
          const settings = data.settings;
          console.log('Footer: Received settings:', settings);
          
          setContactInfo({
            address: settings.address || 'Bakı şəhəri, Yasamal rayonu'
          });
        }
      } catch (error) {
        console.error('Footer: Error loading site settings:', error);
      }
    };

    loadSettings();
    
    // Set up interval to refresh settings every 30 seconds
    const interval = setInterval(loadSettings, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for settings updates from admin panel
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      console.log('Footer: Settings updated event received:', event.detail);
      const settings = event.detail;
      if (settings.address) {
        setContactInfo({
          address: settings.address || contactInfo.address
        });
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, [contactInfo.address]);

  return (
    <footer className="bg-[#0A0A1A] text-[#F0F0F0]">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">SADO-PARTS</h3>
            <p className="text-sm leading-relaxed">
              2008-ci ildən bəri Azərbaycanda forklift sahəsində etibarlı tərəfdaş. 
              Yüksək keyfiyyətli məhsul və xidmətlərlə müştərilərimizin ehtiyaclarını qarşılayırıq.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-gray-400 w-4 h-4" />
                <span className="text-sm">{contactInfo.address}</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-3 pt-2">
              <a href="#" className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-500 transition">
                <FaFacebook className="text-white w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-500 transition">
                <FaInstagram className="text-white w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-500 transition">
                <FaLinkedin className="text-white w-5 h-5" />
              </a>
            </div>
          </div>

          {/* About Company */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">О Компании</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm hover:text-cyan-400 transition">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-sm hover:text-cyan-400 transition">
                  Komandamız
                </Link>
              </li>
              <li>
                <Link href="/career" className="text-sm hover:text-cyan-400 transition">
                  Karyera
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-sm hover:text-cyan-400 transition">
                  Xəbərlər
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Услуги</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalog" className="text-sm hover:text-cyan-400 transition">
                  Forklift Satışı
                </Link>
              </li>
              <li>
                <Link href="/rental" className="text-sm hover:text-cyan-400 transition">
                  Forklift İcarəsi
                </Link>
              </li>
              <li>
                <Link href="/service" className="text-sm hover:text-cyan-400 transition">
                  Texniki Xidmət
                </Link>
              </li>
              <li>
                <Link href="/parts" className="text-sm hover:text-cyan-400 transition">
                  Ehtiyat Hissələri
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Dəstək</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/support" className="text-sm hover:text-cyan-400 transition">
                  Dəstək Mərkəzi
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm hover:text-cyan-400 transition">
                  Sıkça Verilən Suallar
                </Link>
              </li>
              <li>
                <Link href="/technical-support" className="text-sm hover:text-cyan-400 transition">
                  Texniki Dəstək
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-sm hover:text-cyan-400 transition">
                  Zəmanət
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter & Legal Section */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Newsletter */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Xəbər Bülleteni</h4>
              <p className="text-sm text-gray-400">
                Yeni məhsul və xidmətlərimiz haqqında ilk siz xəbər alın
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email ünvanınızı daxil edin"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
                <button className="px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-r-lg transition">
                  <FaPaperPlane className="text-white w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Copyright & Legal */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <p className="text-sm text-gray-400">
                © 2024 Sado-Parts. Все права защищены.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition">
                  Məxfilik Siyasəti
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-cyan-400 transition">
                  İstifadə Şərtləri
                </Link>
                <Link href="/cookies" className="text-gray-400 hover:text-cyan-400 transition">
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <div className="fixed bottom-6 right-6">
        <button className="w-12 h-12 bg-[#0A0A1A] border border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-800 transition shadow-lg">
          <FaQuestion className="text-white w-5 h-5" />
        </button>
      </div>
    </footer>
  );
}
