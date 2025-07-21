'use client';

import { useState } from 'react';
import { 
  FaCog, 
  FaSave, 
  FaUndo, 
  FaShieldAlt, 
  FaBell, 
  FaGlobe,
  FaDatabase,
  FaPalette,
  FaKey,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTruck,
  FaFileInvoice
} from 'react-icons/fa';

interface Settings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    timezone: string;
    currency: string;
    language: string;
  };
  security: {
    sessionTimeout: number;
    requireTwoFactor: boolean;
    passwordMinLength: number;
    maxLoginAttempts: number;
    enableCaptcha: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderNotifications: boolean;
    stockNotifications: boolean;
    reviewNotifications: boolean;
  };
  payment: {
    stripeEnabled: boolean;
    stripeKey: string;
    paypalEnabled: boolean;
    paypalClientId: string;
    bankTransferEnabled: boolean;
    bankDetails: string;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCost: number;
    expressShippingCost: number;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    general: {
      siteName: 'Sado-Parts',
      siteDescription: 'Запчасти для вилочных погрузчиков',
      contactEmail: 'info@sado-parts.ru',
      contactPhone: '+7 (495) 123-45-67',
      address: 'г. Москва, ул. Примерная, д. 123',
      timezone: 'Europe/Moscow',
      currency: 'RUB',
      language: 'ru'
    },
    security: {
      sessionTimeout: 30,
      requireTwoFactor: false,
      passwordMinLength: 8,
      maxLoginAttempts: 5,
      enableCaptcha: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      orderNotifications: true,
      stockNotifications: true,
      reviewNotifications: true
    },
    payment: {
      stripeEnabled: true,
      stripeKey: 'pk_test_1234567890',
      paypalEnabled: false,
      paypalClientId: '',
      bankTransferEnabled: true,
      bankDetails: 'Банк: Сбербанк\nР/с: 40702810123456789012\nИНН: 7707083893'
    },
    shipping: {
      freeShippingThreshold: 10000,
      defaultShippingCost: 500,
      expressShippingCost: 1000,
      pickupEnabled: true,
      deliveryEnabled: true
    },
    appearance: {
      theme: 'auto',
      primaryColor: '#3B82F6',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico'
    }
  });

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'payment' | 'shipping' | 'appearance'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    // Simulate save process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaveMessage('Настройки успешно сохранены!');
    setIsSaving(false);
    
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleReset = () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
      // Reset to default values
      setSaveMessage('Настройки сброшены к значениям по умолчанию');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const tabs = [
    { id: 'general', name: 'Общие', icon: FaCog },
    { id: 'security', name: 'Безопасность', icon: FaShieldAlt },
    { id: 'notifications', name: 'Уведомления', icon: FaBell },
    { id: 'payment', name: 'Платежи', icon: FaCreditCard },
    { id: 'shipping', name: 'Доставка', icon: FaTruck },
    { id: 'appearance', name: 'Внешний вид', icon: FaPalette }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Настройки</h1>
          <p className="text-gray-600 dark:text-gray-400">Управление системными настройками</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition flex items-center"
          >
            <FaUndo className="mr-2" />
            Сбросить
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">{saveMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Общие настройки</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Название сайта
                  </label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, siteName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Описание сайта
                  </label>
                  <input
                    type="text"
                    value={settings.general.siteDescription}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, siteDescription: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email для связи
                  </label>
                  <input
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, contactEmail: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Телефон для связи
                  </label>
                  <input
                    type="tel"
                    value={settings.general.contactPhone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, contactPhone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Адрес
                  </label>
                  <input
                    type="text"
                    value={settings.general.address}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, address: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Часовой пояс
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, timezone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Europe/Moscow">Москва (UTC+3)</option>
                    <option value="Europe/London">Лондон (UTC+0)</option>
                    <option value="America/New_York">Нью-Йорк (UTC-5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Валюта
                  </label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, currency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="RUB">Рубль (₽)</option>
                    <option value="USD">Доллар ($)</option>
                    <option value="EUR">Евро (€)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Настройки безопасности</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Таймаут сессии (минуты)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Минимальная длина пароля
                  </label>
                  <input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Максимум попыток входа
                  </label>
                  <input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.security.requireTwoFactor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, requireTwoFactor: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Требовать двухфакторную аутентификацию</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.security.enableCaptcha}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, enableCaptcha: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Включить CAPTCHA</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Настройки уведомлений</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailNotifications: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Email уведомления</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, smsNotifications: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">SMS уведомления</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.orderNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, orderNotifications: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Уведомления о заказах</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.stockNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, stockNotifications: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Уведомления о складских остатках</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.reviewNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, reviewNotifications: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Уведомления о новых отзывах</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Настройки платежей</h3>
              
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Stripe</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.payment.stripeEnabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment: { ...prev.payment, stripeEnabled: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Включить</span>
                    </label>
                  </div>
                  
                  {settings.payment.stripeEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Публичный ключ
                      </label>
                      <input
                        type="text"
                        value={settings.payment.stripeKey}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment: { ...prev.payment, stripeKey: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">PayPal</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.payment.paypalEnabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment: { ...prev.payment, paypalEnabled: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Включить</span>
                    </label>
                  </div>
                  
                  {settings.payment.paypalEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={settings.payment.paypalClientId}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment: { ...prev.payment, paypalClientId: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Банковский перевод</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.payment.bankTransferEnabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment: { ...prev.payment, bankTransferEnabled: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Включить</span>
                    </label>
                  </div>
                  
                  {settings.payment.bankTransferEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Банковские реквизиты
                      </label>
                      <textarea
                        value={settings.payment.bankDetails}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment: { ...prev.payment, bankDetails: e.target.value }
                        }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Настройки доставки</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Порог бесплатной доставки (₽)
                  </label>
                  <input
                    type="number"
                    value={settings.shipping.freeShippingThreshold}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, freeShippingThreshold: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Стоимость стандартной доставки (₽)
                  </label>
                  <input
                    type="number"
                    value={settings.shipping.defaultShippingCost}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, defaultShippingCost: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Стоимость экспресс-доставки (₽)
                  </label>
                  <input
                    type="number"
                    value={settings.shipping.expressShippingCost}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, expressShippingCost: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.shipping.pickupEnabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        shipping: { ...prev.shipping, pickupEnabled: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Включить самовывоз</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.shipping.deliveryEnabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        shipping: { ...prev.shipping, deliveryEnabled: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Включить доставку</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Настройки внешнего вида</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тема оформления
                  </label>
                  <select
                    value={settings.appearance.theme}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: e.target.value as any }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="light">Светлая</option>
                    <option value="dark">Темная</option>
                    <option value="auto">Автоматически</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Основной цвет
                  </label>
                  <input
                    type="color"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, primaryColor: e.target.value }
                    }))}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL логотипа
                  </label>
                  <input
                    type="url"
                    value={settings.appearance.logoUrl}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, logoUrl: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL фавикона
                  </label>
                  <input
                    type="url"
                    value={settings.appearance.faviconUrl}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, faviconUrl: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 