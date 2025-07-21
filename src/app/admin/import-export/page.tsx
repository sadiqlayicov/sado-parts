'use client';

import { useState } from 'react';
import { 
  FaFileExcel, 
  FaFileCsv, 
  FaFileAlt, 
  FaUpload, 
  FaDownload, 
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCog,
  FaHistory,
  FaTrash,
  FaPlay,
  FaPause,
  FaStop
} from 'react-icons/fa';

interface ImportJob {
  id: string;
  name: string;
  type: 'import' | 'export';
  format: 'excel' | 'csv' | 'json' | 'xml';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([
    {
      id: '1',
      name: 'products_import_2024.xlsx',
      type: 'import',
      format: 'excel',
      status: 'completed',
      progress: 100,
      totalItems: 150,
      processedItems: 150,
      createdAt: '2024-01-15 10:30',
      completedAt: '2024-01-15 10:35'
    },
    {
      id: '2',
      name: 'orders_export.csv',
      type: 'export',
      format: 'csv',
      status: 'running',
      progress: 65,
      totalItems: 200,
      processedItems: 130,
      createdAt: '2024-01-15 11:00'
    },
    {
      id: '3',
      name: 'users_import.json',
      type: 'import',
      format: 'json',
      status: 'failed',
      progress: 0,
      totalItems: 50,
      processedItems: 0,
      createdAt: '2024-01-15 09:15',
      error: 'Invalid JSON format'
    }
  ]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importConfig, setImportConfig] = useState({
    updateExisting: true,
    skipDuplicates: false,
    validateData: true,
    category: 'all'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'running': return 'Выполняется';
      case 'completed': return 'Завершено';
      case 'failed': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel': return <FaFileExcel className="h-5 w-5 text-green-600" />;
      case 'csv': return <FaFileCsv className="h-5 w-5 text-blue-600" />;
      case 'json': return <FaFileAlt className="h-5 w-5 text-yellow-600" />;
      case 'xml': return <FaFileAlt className="h-5 w-5 text-purple-600" />;
      default: return <FaFileAlt className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowImportModal(true);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const newJob: ImportJob = {
      id: Date.now().toString(),
      name: selectedFile.name,
      type: 'import',
      format: selectedFile.name.endsWith('.xlsx') ? 'excel' : 
              selectedFile.name.endsWith('.csv') ? 'csv' : 
              selectedFile.name.endsWith('.json') ? 'json' : 'xml',
      status: 'running',
      progress: 0,
      totalItems: Math.floor(Math.random() * 200) + 50,
      processedItems: 0,
      createdAt: new Date().toLocaleString()
    };

    setImportJobs(prev => [newJob, ...prev]);
    setShowImportModal(false);
    setSelectedFile(null);

    // Simulate import process
    const interval = setInterval(() => {
      setImportJobs(prev => prev.map(job => {
        if (job.id === newJob.id && job.status === 'running') {
          const newProgress = Math.min(job.progress + Math.random() * 20, 100);
          const newProcessedItems = Math.floor((newProgress / 100) * job.totalItems);
          
          if (newProgress >= 100) {
            clearInterval(interval);
            return {
              ...job,
              progress: 100,
              processedItems: job.totalItems,
              status: 'completed' as const,
              completedAt: new Date().toLocaleString()
            };
          }
          
          return {
            ...job,
            progress: newProgress,
            processedItems: newProcessedItems
          };
        }
        return job;
      }));
    }, 1000);
  };

  const handleExport = (format: string) => {
    const newJob: ImportJob = {
      id: Date.now().toString(),
      name: `export_${Date.now()}.${format}`,
      type: 'export',
      format: format as any,
      status: 'running',
      progress: 0,
      totalItems: Math.floor(Math.random() * 500) + 100,
      processedItems: 0,
      createdAt: new Date().toLocaleString()
    };

    setImportJobs(prev => [newJob, ...prev]);

    // Simulate export process
    const interval = setInterval(() => {
      setImportJobs(prev => prev.map(job => {
        if (job.id === newJob.id && job.status === 'running') {
          const newProgress = Math.min(job.progress + Math.random() * 30, 100);
          const newProcessedItems = Math.floor((newProgress / 100) * job.totalItems);
          
          if (newProgress >= 100) {
            clearInterval(interval);
            return {
              ...job,
              progress: 100,
              processedItems: job.totalItems,
              status: 'completed' as const,
              completedAt: new Date().toLocaleString()
            };
          }
          
          return {
            ...job,
            progress: newProgress,
            processedItems: newProcessedItems
          };
        }
        return job;
      }));
    }, 800);
  };

  const handleCancelJob = (jobId: string) => {
    setImportJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'failed' as const } : job
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Импорт/Экспорт</h1>
          <p className="text-gray-600 dark:text-gray-400">Управление импортом и экспортом данных</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Импорт
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Экспорт
          </button>
        </nav>
      </div>

      {activeTab === 'import' ? (
        /* Import Section */
        <div className="space-y-6">
          {/* Import Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Импорт данных</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition">
                <FaFileExcel className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Excel файл</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Поддерживает .xlsx и .xls файлы
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition cursor-pointer"
                >
                  <FaUpload className="mr-2" />
                  Выбрать файл
                </label>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition">
                <FaFileCsv className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">CSV файл</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Поддерживает .csv файлы
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer"
                >
                  <FaUpload className="mr-2" />
                  Выбрать файл
                </label>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition">
                <FaFileAlt className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">JSON файл</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Поддерживает .json файлы
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="json-upload"
                />
                <label
                  htmlFor="json-upload"
                  className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition cursor-pointer"
                >
                  <FaUpload className="mr-2" />
                  Выбрать файл
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Export Section */
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Экспорт данных</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleExport('xlsx')}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <FaFileExcel className="h-8 w-8 text-green-600 mr-3" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white">Товары</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Excel формат</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <FaFileCsv className="h-8 w-8 text-blue-600 mr-3" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white">Заказы</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CSV формат</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <FaFileAlt className="h-8 w-8 text-yellow-600 mr-3" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white">Пользователи</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">JSON формат</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('xml')}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <FaFileAlt className="h-8 w-8 text-purple-600 mr-3" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white">Аналитика</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">XML формат</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">История операций</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {importJobs.map((job) => (
              <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getFormatIcon(job.format)}
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{job.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {job.type === 'import' ? 'Импорт' : 'Экспорт'} • {job.format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getStatusText(job.status)}
                    </span>
                    {job.status === 'running' && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <FaStop className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {job.status === 'running' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Прогресс</span>
                      <span>{job.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span>Обработано: {job.processedItems} из {job.totalItems}</span>
                      <span>{job.createdAt}</span>
                    </div>
                  </div>
                )}

                {job.status === 'completed' && (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Обработано {job.totalItems} элементов</span>
                    <span>Завершено: {job.completedAt}</span>
                  </div>
                )}

                {job.status === 'failed' && job.error && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Ошибка: {job.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import Configuration Modal */}
      {showImportModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Настройки импорта
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Файл: {selectedFile.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Размер: {(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importConfig.updateExisting}
                    onChange={(e) => setImportConfig(prev => ({ ...prev, updateExisting: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Обновлять существующие записи</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importConfig.skipDuplicates}
                    onChange={(e) => setImportConfig(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Пропускать дубликаты</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importConfig.validateData}
                    onChange={(e) => setImportConfig(prev => ({ ...prev, validateData: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Валидировать данные</span>
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Начать импорт
              </button>
              <button
                onClick={() => setShowImportModal(false)}
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