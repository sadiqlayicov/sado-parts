'use client';

import { useState } from 'react';
import { 
  FaGlobe, 
  FaSync, 
  FaUpload, 
  FaDownload, 
  FaCog, 
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
  FaPlus
} from 'react-icons/fa';

interface Marketplace {
  id: string;
  name: string;
  logo: string;
  status: 'active' | 'inactive' | 'error';
  productsCount: number;
  ordersCount: number;
  revenue: number;
  lastSync: string;
  apiKey: string;
  isConnected: boolean;
}

export default function MarketplacesPage() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([
    {
      id: '1',
      name: 'Avito',
      logo: '🟢',
      status: 'active',
      productsCount: 156,
      ordersCount: 23,
      revenue: 125000,
      lastSync: '2 мин назад',
      apiKey: 'avito_api_key_123',
      isConnected: true
    },
    {
      id: '2',
      name: 'Ozon',
      logo: '🟠',
      status: 'active',
      productsCount: 89,
      ordersCount: 15,
      revenue: 89000,
      lastSync: '5 мин назад',
      apiKey: 'ozon_api_key_456',
      isConnected: true
    },
    {
      id: '3',
      name: 'Яндекс.Маркет',
      logo: '🟡',
      status: 'inactive',
      productsCount: 0,
      ordersCount: 0,
      revenue: 0,
      lastSync: 'Никогда',
      apiKey: '',
      isConnected: false
    },
    {
      id: '4',
      name: 'Wildberries',
      logo: '🟣',
      status: 'error',
      productsCount: 45,
      ordersCount: 8,
      revenue: 67000,
      lastSync: '1 час назад',
      apiKey: 'wb_api_key_789',
      isConnected: true
    }
  ]);

  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [configData, setConfigData] = useState({
    apiKey: '',
    apiSecret: '',
    shopId: '',
    webhookUrl: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      case 'error': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  const handleSync = async (marketplaceId: string) => {
    const marketplace = marketplaces.find(m => m.id === marketplaceId);
    if (!marketplace) return;

    setSelectedMarketplace(marketplace);
    setShowSyncModal(true);
  };

  const handleConfigure = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setConfigData({
      apiKey: marketplace.apiKey,
      apiSecret: '',
      shopId: '',
      webhookUrl: ''
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = () => {
    if (!selectedMarketplace) return;

    setMarketplaces(prev => prev.map(m => 
      m.id === selectedMarketplace.id 
        ? { ...m, apiKey: configData.apiKey, isConnected: true, status: 'active' as const }
        : m
    ));
    setShowConfigModal(false);
  };

  const handleSyncProducts = async () => {
    if (!selectedMarketplace) return;

    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setMarketplaces(prev => prev.map(m => 
      m.id === selectedMarketplace.id 
        ? { ...m, lastSync: 'Только что', productsCount: m.productsCount + Math.floor(Math.random() * 10) }
        : m
    ));
    setShowSyncModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Маркетплейсы</h1>
          <p className="text-gray-600 dark:text-gray-400">Управление интеграциями с торговыми площадками</p>
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center">
          <FaPlus className="mr-2" />
          Добавить площадку
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FaGlobe className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Активные площадки</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {marketplaces.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FaUpload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего товаров</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {marketplaces.reduce((sum, m) => sum + m.productsCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FaChartLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего заказов</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {marketplaces.reduce((sum, m) => sum + m.ordersCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FaDownload className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Общая выручка</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(marketplaces.reduce((sum, m) => sum + m.revenue, 0) / 1000).toFixed(1)}K ₽
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplaces List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Подключенные площадки</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketplaces.map((marketplace) => (
              <div key={marketplace.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{marketplace.logo}</span>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">{marketplace.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(marketplace.status)}`}>
                        {getStatusText(marketplace.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSync(marketplace.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="Синхронизировать"
                    >
                      <FaSync className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleConfigure(marketplace)}
                      className="p-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Настроить"
                    >
                      <FaCog className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Товары</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{marketplace.productsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Заказы</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{marketplace.ordersCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Выручка</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{(marketplace.revenue / 1000).toFixed(1)}K ₽</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Последняя синхронизация: {marketplace.lastSync}</span>
                  {marketplace.isConnected ? (
                    <FaCheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <FaTimesCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedMarketplace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Настройка {selectedMarketplace.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Ключ
                </label>
                <input
                  type="text"
                  value={configData.apiKey}
                  onChange={(e) => setConfigData(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Секрет
                </label>
                <input
                  type="password"
                  value={configData.apiSecret}
                  onChange={(e) => setConfigData(prev => ({ ...prev, apiSecret: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Магазина
                </label>
                <input
                  type="text"
                  value={configData.shopId}
                  onChange={(e) => setConfigData(prev => ({ ...prev, shopId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && selectedMarketplace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Синхронизация {selectedMarketplace.name}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="sync-products" defaultChecked />
                <label htmlFor="sync-products" className="text-sm text-gray-700 dark:text-gray-300">
                  Синхронизировать товары
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="sync-orders" defaultChecked />
                <label htmlFor="sync-orders" className="text-sm text-gray-700 dark:text-gray-300">
                  Синхронизировать заказы
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="sync-prices" defaultChecked />
                <label htmlFor="sync-prices" className="text-sm text-gray-700 dark:text-gray-300">
                  Обновить цены
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSyncProducts}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Начать синхронизацию
              </button>
              <button
                onClick={() => setShowSyncModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 