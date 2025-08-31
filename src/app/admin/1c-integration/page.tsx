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
    url: 'https://sado-parts.vercel.app/api/1c_exchange.php',
    username: 'admin',
    password: 'Admin123',
    enabled: true
  });

  const [uploadStatus, setUploadStatus] = useState({
    hasContent: false,
    contentLength: 0,
    productCount: 0,
    lastActivity: null as string | null,
    uploadProgress: 'Waiting for 1C...'
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
    loadUploadStatus(); // Load upload status on mount
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

  const loadUploadStatus = async () => {
    try {
      const response = await fetch('/api/1c-debug');
      if (response.ok) {
        const data = await response.json();
        setUploadStatus({
          hasContent: !!data.globalState?.uploadedFileContent,
          contentLength: data.globalState?.uploadedFileContent?.includes('Content length:') 
            ? parseInt(data.globalState.uploadedFileContent.match(/Content length: (\d+)/)?.[1] || '0')
            : 0,
          productCount: 0, // Will be calculated from content
          lastActivity: data.globalState?.uploadedFileContent ? 'File received' : null,
          uploadProgress: data.globalState?.uploadedFileContent ? 'File uploaded successfully' : 'Waiting for 1C...'
        });
      }
    } catch (error) {
      console.error('Error loading upload status:', error);
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

  const refreshStatus = async () => {
    await loadIntegrationStatus();
    await loadUploadStatus();
    addSyncResult({
      success: true,
      message: 'Статус обновлен',
      timestamp: new Date().toISOString()
    });
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">1C Интеграция - Статус</h1>
          <p className="text-gray-600">Мониторинг синхронизации с 1C</p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Section */}
          <div className="space-y-6">
            {/* Real-time Upload Status */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Статус загрузки 1C</h2>
                <button
                  onClick={refreshStatus}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Обновить
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Статус загрузки:</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${uploadStatus.hasContent ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className={`font-semibold ${uploadStatus.hasContent ? 'text-green-600' : 'text-yellow-600'}`}>
                      {uploadStatus.uploadProgress}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Размер файла:</span>
                  <span className="text-gray-900 font-medium">
                    {uploadStatus.contentLength > 0 ? `${uploadStatus.contentLength} байт` : 'Нет данных'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Последняя активность:</span>
                  <span className="text-gray-500">
                    {uploadStatus.lastActivity || 'Нет активности'}
                  </span>
                </div>
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
          </div>

          {/* Products and Orders Section */}
          <div className="space-y-6">
            {/* Uploaded Products */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Загруженные товары</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Всего товаров:</span>
                  <span className="text-gray-900 font-semibold text-lg">
                    {uploadStatus.productCount > 0 ? uploadStatus.productCount : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Последнее обновление:</span>
                  <span className="text-gray-500">
                    {uploadStatus.lastActivity || 'Нет данных'}
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-700 text-sm">
                    Товары автоматически загружаются из 1C при синхронизации
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Orders */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Загруженные заказы</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Всего заказов:</span>
                  <span className="text-gray-900 font-semibold text-lg">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Последнее обновление:</span>
                  <span className="text-gray-500">Нет данных</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm">
                    Заказы с сайта автоматически экспортируются в 1C
                  </p>
                </div>
              </div>
            </div>

            {/* Sync History */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">История синхронизации</h2>
              <div className="space-y-3">
                {syncResults.length > 0 ? (
                  syncResults.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                          {result.message}
                        </p>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(result.timestamp).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">История синхронизации пуста</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
