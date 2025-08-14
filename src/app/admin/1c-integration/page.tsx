'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface SyncStats {
  updated: number;
  created: number;
  errors: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  stats?: SyncStats;
  count?: number;
  products?: any[];
  orders?: any[];
  categories?: any[];
  inventory?: any[];
}

export default function Admin1CIntegrationPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastSync, setLastSync] = useState<string>('');
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user]);

  const handleApiCall = async (action: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
    setLoading(true);
    try {
      const url = `/api/1c-exchange?action=${action}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data && method === 'POST') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();
      
      setApiResponse(result);
      
      if (result.success) {
        setLastSync(new Date().toLocaleString('ru-RU'));
        if (result.stats) {
          setSyncStats(result.stats);
        }
      }
      
      return result;
    } catch (error) {
      console.error('API call error:', error);
      setApiResponse({
        success: false,
        message: `Ошибка API: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileSync = async () => {
    if (!selectedFile) {
      alert('Пожалуйста, выберите файл для синхронизации');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/1c-exchange?action=import_file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setApiResponse(result);
      
      if (result.success) {
        setLastSync(new Date().toLocaleString('ru-RU'));
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('File sync error:', error);
      setApiResponse({
        success: false,
        message: `Ошибка синхронизации файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (action: string, format: 'json' | 'xml' = 'json') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/1c-exchange?action=${action}&format=${format}`);
      
      if (format === 'xml') {
        const xmlText = await response.text();
        const blob = new Blob([xmlText], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${action}_${new Date().toISOString().split('T')[0]}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${action}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      setApiResponse({
        success: true,
        message: `Данные успешно экспортированы в формате ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Export error:', error);
      setApiResponse({
        success: false,
        message: `Ошибка экспорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">1C ERP Интеграция</h1>
          <p className="text-gray-300">Управление синхронизацией с 1C ERP системой</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-[#1e293b] rounded-lg p-1">
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
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-[#0f172a]'
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                  <h2 className="text-xl font-bold text-white mb-4">Статус интеграции</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="text-green-400 font-semibold">Статус</div>
                      <div className="text-white">Активна</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="text-blue-400 font-semibold">Последняя синхронизация</div>
                      <div className="text-white">{lastSync || 'Не синхронизировано'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                  <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleApiCall('get_products')}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      📦 Получить товары
                    </button>
                    <button
                      onClick={() => handleApiCall('get_orders')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      📋 Получить заказы
                    </button>
                    <button
                      onClick={() => handleApiCall('get_inventory')}
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      📈 Получить остатки
                    </button>
                    <button
                      onClick={() => exportData('get_products', 'xml')}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      📄 Экспорт XML
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Управление товарами</h2>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApiCall('get_products')}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Получить товары
                    </button>
                    <button
                      onClick={() => exportData('get_products', 'json')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Экспорт JSON
                    </button>
                    <button
                      onClick={() => exportData('get_products', 'xml')}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Экспорт XML
                    </button>
                  </div>
                  
                  {apiResponse && (
                    <div className={`p-4 rounded-lg ${
                      apiResponse.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <div className={`font-semibold ${
                        apiResponse.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {apiResponse.message}
                      </div>
                      {apiResponse.count && (
                        <div className="text-white mt-2">
                          Количество записей: {apiResponse.count}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Управление заказами</h2>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApiCall('get_orders')}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Получить заказы
                    </button>
                    <button
                      onClick={() => exportData('get_orders', 'json')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Экспорт JSON
                    </button>
                    <button
                      onClick={() => exportData('get_orders', 'xml')}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Экспорт XML
                    </button>
                  </div>
                  
                  {apiResponse && (
                    <div className={`p-4 rounded-lg ${
                      apiResponse.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <div className={`font-semibold ${
                        apiResponse.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {apiResponse.message}
                      </div>
                      {apiResponse.count && (
                        <div className="text-white mt-2">
                          Количество заказов: {apiResponse.count}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Управление категориями</h2>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApiCall('get_categories')}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Получить категории
                    </button>
                    <button
                      onClick={() => exportData('get_categories', 'json')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Экспорт JSON
                    </button>
                    <button
                      onClick={() => exportData('get_categories', 'xml')}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Экспорт XML
                    </button>
                  </div>
                  
                  {apiResponse && (
                    <div className={`p-4 rounded-lg ${
                      apiResponse.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <div className={`font-semibold ${
                        apiResponse.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {apiResponse.message}
                      </div>
                      {apiResponse.count && (
                        <div className="text-white mt-2">
                          Количество категорий: {apiResponse.count}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Управление остатками</h2>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApiCall('get_inventory')}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Получить остатки
                    </button>
                    <button
                      onClick={() => exportData('get_inventory', 'json')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Экспорт JSON
                    </button>
                    <button
                      onClick={() => exportData('get_inventory', 'xml')}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      Экспорт XML
                    </button>
                  </div>
                  
                  {apiResponse && (
                    <div className={`p-4 rounded-lg ${
                      apiResponse.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <div className={`font-semibold ${
                        apiResponse.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {apiResponse.message}
                      </div>
                      {apiResponse.count && (
                        <div className="text-white mt-2">
                          Количество товаров: {apiResponse.count}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sync Tab */}
            {activeTab === 'sync' && (
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Синхронизация данных</h2>
                <div className="space-y-6">
                  {/* File Upload */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Загрузка файла для синхронизации</h3>
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept=".xml,.json,.csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                      />
                      {selectedFile && (
                        <div className="text-green-400">
                          Выбран файл: {selectedFile.name}
                        </div>
                      )}
                      <button
                        onClick={handleFileSync}
                        disabled={!selectedFile || loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                      >
                        Синхронизировать файл
                      </button>
                    </div>
                  </div>

                  {/* Manual Sync */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Ручная синхронизация</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleApiCall('sync_products', 'POST', [])}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                      >
                        Синхронизировать товары
                      </button>
                      <button
                        onClick={() => handleApiCall('sync_orders', 'POST', [])}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                      >
                        Синхронизировать заказы
                      </button>
                      <button
                        onClick={() => handleApiCall('update_inventory', 'POST', [])}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                      >
                        Обновить остатки
                      </button>
                    </div>
                  </div>

                  {/* Sync Stats */}
                  {syncStats && (
                    <div className="border border-gray-600 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Статистика синхронизации</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-green-400 font-bold">{syncStats.updated}</div>
                          <div className="text-gray-400 text-sm">Обновлено</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-bold">{syncStats.created}</div>
                          <div className="text-gray-400 text-sm">Создано</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-400 font-bold">{syncStats.errors}</div>
                          <div className="text-gray-400 text-sm">Ошибок</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Настройки интеграции</h2>
                <div className="space-y-6">
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">API Endpoints</h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-gray-300">
                        <span className="text-blue-400">GET</span> /api/1c-exchange?action=get_products
                      </div>
                      <div className="text-gray-300">
                        <span className="text-blue-400">GET</span> /api/1c-exchange?action=get_orders
                      </div>
                      <div className="text-gray-300">
                        <span className="text-blue-400">GET</span> /api/1c-exchange?action=get_categories
                      </div>
                      <div className="text-gray-300">
                        <span className="text-blue-400">GET</span> /api/1c-exchange?action=get_inventory
                      </div>
                      <div className="text-gray-300">
                        <span className="text-green-400">POST</span> /api/1c-exchange?action=sync_products
                      </div>
                      <div className="text-gray-300">
                        <span className="text-green-400">POST</span> /api/1c-exchange?action=sync_orders
                      </div>
                      <div className="text-gray-300">
                        <span className="text-green-400">POST</span> /api/1c-exchange?action=update_inventory
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-600 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Форматы данных</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div>• JSON - для веб-интеграции</div>
                      <div>• XML - для 1C ERP</div>
                      <div>• Автоматическая конвертация между форматами</div>
                    </div>
                  </div>

                  <div className="border border-gray-600 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Автоматическая синхронизация</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Синхронизация товаров</span>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                          Включить
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Синхронизация заказов</span>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                          Включить
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Обновление остатков</span>
                        <button className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm">
                          Выключено
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Статус системы</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">API статус</span>
                  <span className="text-green-400">● Активен</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">База данных</span>
                  <span className="text-green-400">● Подключена</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Последняя синхронизация</span>
                  <span className="text-blue-400 text-sm">{lastSync || 'Нет'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleApiCall('get_products')}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50 text-sm"
                >
                  📦 Получить товары
                </button>
                <button
                  onClick={() => handleApiCall('get_orders')}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50 text-sm"
                >
                  📋 Получить заказы
                </button>
                <button
                  onClick={() => exportData('get_products', 'xml')}
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition disabled:opacity-50 text-sm"
                >
                  📄 Экспорт XML
                </button>
              </div>
            </div>

            {/* API Response */}
            {apiResponse && (
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Результат API</h2>
                <div className={`p-3 rounded-lg ${
                  apiResponse.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <div className={`font-semibold text-sm ${
                    apiResponse.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {apiResponse.message}
                  </div>
                  {apiResponse.stats && (
                    <div className="text-white text-sm mt-2">
                      <div>Обновлено: {apiResponse.stats.updated}</div>
                      <div>Создано: {apiResponse.stats.created}</div>
                      <div>Ошибок: {apiResponse.stats.errors}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
