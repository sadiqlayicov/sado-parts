'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';

interface IntegrationStatus {
  isConnected: boolean;
  lastSync: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

export default function Admin1CIntegrationPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    isConnected: false,
    lastSync: null,
    syncStatus: 'idle'
  });
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionSettings, setConnectionSettings] = useState({
    url: '',
    username: '',
    password: '',
    enabled: false
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user?.isAdmin) {
      router.push('/');
      return;
    }
    
    // Load integration settings and status
    loadIntegrationStatus();
    loadConnectionSettings();
  }, [isAuthenticated, user, router]);

  const loadIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/1c-integration/status');
      if (response.ok) {
        const data = await response.json();
        setIntegrationStatus(data);
      }
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  };

  const loadConnectionSettings = async () => {
    try {
      const response = await fetch('/api/1c-integration/settings');
      if (response.ok) {
        const data = await response.json();
        setConnectionSettings(data);
      }
    } catch (error) {
      console.error('Error loading connection settings:', error);
    }
  };

  const testConnection = async () => {
    if (!connectionSettings.url || !connectionSettings.username || !connectionSettings.password) {
      addSyncResult({
        success: false,
        message: 'Пожалуйста, заполните все поля настроек соединения',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/1c-integration/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionSettings)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIntegrationStatus(prev => ({
          ...prev,
          isConnected: true,
          syncStatus: 'success'
        }));
        addSyncResult({
          success: true,
          message: 'Соединение с 1C успешно установлено',
          timestamp: new Date().toISOString()
        });
      } else {
        setIntegrationStatus(prev => ({
          ...prev,
          isConnected: false,
          syncStatus: 'error',
          errorMessage: result.error
        }));
        addSyncResult({
          success: false,
          message: `Ошибка соединения: ${result.error}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setIntegrationStatus(prev => ({
        ...prev,
        isConnected: false,
        syncStatus: 'error',
        errorMessage: 'Ошибка сети'
      }));
      addSyncResult({
        success: false,
        message: 'Ошибка сети при тестировании соединения',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/1c-integration/sync-products', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIntegrationStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
          syncStatus: 'success'
        }));
        addSyncResult({
          success: true,
          message: `Синхронизировано ${result.count} товаров`,
          data: result,
          timestamp: new Date().toISOString()
        });
      } else {
        setIntegrationStatus(prev => ({
          ...prev,
          syncStatus: 'error',
          errorMessage: result.error
        }));
        addSyncResult({
          success: false,
          message: `Ошибка синхронизации товаров: ${result.error}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setIntegrationStatus(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: 'Ошибка сети'
      }));
      addSyncResult({
        success: false,
        message: 'Ошибка сети при синхронизации товаров',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/1c-integration/sync-inventory', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIntegrationStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
          syncStatus: 'success'
        }));
        addSyncResult({
          success: true,
          message: `Синхронизировано ${result.count} остатков`,
          data: result,
          timestamp: new Date().toISOString()
        });
      } else {
        setIntegrationStatus(prev => ({
          ...prev,
          syncStatus: 'error',
          errorMessage: result.error
        }));
        addSyncResult({
          success: false,
          message: `Ошибка синхронизации остатков: ${result.error}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setIntegrationStatus(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: 'Ошибка сети'
      }));
      addSyncResult({
        success: false,
        message: 'Ошибка сети при синхронизации остатков',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/1c-integration/sync-orders', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIntegrationStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
          syncStatus: 'success'
        }));
        addSyncResult({
          success: true,
          message: `Синхронизировано ${result.count} заказов`,
          data: result,
          timestamp: new Date().toISOString()
        });
      } else {
        setIntegrationStatus(prev => ({
          ...prev,
          syncStatus: 'error',
          errorMessage: result.error
        }));
        addSyncResult({
          success: false,
          message: `Ошибка синхронизации заказов: ${result.error}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setIntegrationStatus(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: 'Ошибка сети'
      }));
      addSyncResult({
        success: false,
        message: 'Ошибка сети при синхронизации заказов',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportTo1C = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/1c-integration/export', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIntegrationStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
          syncStatus: 'success'
        }));
        addSyncResult({
          success: true,
          message: 'Данные успешно экспортированы в 1C',
          data: result,
          timestamp: new Date().toISOString()
        });
      } else {
        setIntegrationStatus(prev => ({
          ...prev,
          syncStatus: 'error',
          errorMessage: result.error
        }));
        addSyncResult({
          success: false,
          message: `Ошибка экспорта: ${result.error}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setIntegrationStatus(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: 'Ошибка сети'
      }));
      addSyncResult({
        success: false,
        message: 'Ошибка сети при экспорте',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSyncResult = (result: SyncResult) => {
    setSyncResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const saveConnectionSettings = async () => {
    try {
      const response = await fetch('/api/1c-integration/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionSettings)
      });
      
      if (response.ok) {
        addSyncResult({
          success: true,
          message: 'Настройки соединения сохранены',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      addSyncResult({
        success: false,
        message: 'Ошибка сохранения настроек',
        timestamp: new Date().toISOString()
      });
    }
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'syncing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'syncing': return '🔄';
      default: return '⏸️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">1C Управление нашей фирмой 3.0 Интеграция</h1>
          <p className="text-gray-600">Синхронизация с 1C Управление нашей фирмой, редакция 3.0 (3.0.12.146)</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview', name: 'Обзор', icon: '📊' },
              { id: 'products', name: 'Товары', icon: '📦' },
              { id: 'orders', name: 'Заказы', icon: '📋' },
              { id: 'categories', name: 'Категории', icon: '📁' },
              { id: 'inventory', name: 'Остатки', icon: '📈' },
              { id: 'sync', name: 'Синхронизация', icon: '🔄' },
              { id: 'settings', name: 'Настройки', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Settings - Always Visible */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Настройки соединения</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL 1C
                  </label>
                  <input
                    type="url"
                    value={connectionSettings.url}
                    onChange={(e) => setConnectionSettings(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="http://192.168.1.100:8080"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Логин
                  </label>
                  <input
                    type="text"
                    value={connectionSettings.username}
                    onChange={(e) => setConnectionSettings(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="admin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={connectionSettings.password}
                    onChange={(e) => setConnectionSettings(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Пароль"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center justify-end">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={connectionSettings.enabled}
                      onChange={(e) => setConnectionSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Включить интеграцию
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={saveConnectionSettings}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Сохранить настройки
                </button>
                <button 
                  onClick={testConnection}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {isLoading ? 'Проверка...' : 'Проверить соединение'}
                </button>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Статус интеграции</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Статус соединения:</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${integrationStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`font-semibold ${integrationStatus.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {integrationStatus.isConnected ? 'Подключено' : 'Отключено'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Последняя синхронизация:</span>
                  <span className="text-gray-500">
                    {integrationStatus.lastSync 
                      ? new Date(integrationStatus.lastSync).toLocaleString('ru-RU')
                      : 'Не синхронизировано'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Статус синхронизации:</span>
                  <div className="flex items-center">
                    <span className="mr-2">{getStatusIcon(integrationStatus.syncStatus)}</span>
                    <span className={`font-semibold ${getStatusColor(integrationStatus.syncStatus)}`}>
                      {integrationStatus.syncStatus === 'idle' && 'Ожидание'}
                      {integrationStatus.syncStatus === 'syncing' && 'Синхронизация...'}
                      {integrationStatus.syncStatus === 'success' && 'Успешно'}
                      {integrationStatus.syncStatus === 'error' && 'Ошибка'}
                    </span>
                  </div>
                </div>
                {integrationStatus.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{integrationStatus.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Статус системы</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">API статус:</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-600 font-semibold">Активен</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">База данных:</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-600 font-semibold">Подключена</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">1C версия:</span>
                  <span className="text-gray-900 font-medium">Управление нашей фирмой 3.0.12.146</span>
                </div>
              </div>
            </div>

            {/* Sync Results */}
            {syncResults.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">История синхронизации</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {syncResults.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                          {result.message}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Быстрые действия</h2>
              <div className="space-y-3">
                <button 
                  onClick={syncProducts}
                  disabled={isLoading || !integrationStatus.isConnected}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {isLoading ? 'Синхронизация...' : 'Синхронизировать товары'}
                </button>
                <button 
                  onClick={syncInventory}
                  disabled={isLoading || !integrationStatus.isConnected}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {isLoading ? 'Синхронизация...' : 'Синхронизировать остатки'}
                </button>
                <button 
                  onClick={syncOrders}
                  disabled={isLoading || !integrationStatus.isConnected}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {isLoading ? 'Синхронизация...' : 'Синхронизировать заказы'}
                </button>
                <button 
                  onClick={exportTo1C}
                  disabled={isLoading || !integrationStatus.isConnected}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {isLoading ? 'Экспорт...' : 'Экспорт в 1C'}
                </button>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Подсказка</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>1. Заполните настройки соединения</p>
                <p>2. Нажмите "Проверить соединение"</p>
                <p>3. После успешного подключения используйте кнопки синхронизации</p>
                <p className="text-xs mt-3">
                  <strong>Пример URL:</strong> http://192.168.1.100:8080
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
