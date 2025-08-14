'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { FaUpload, FaFileAlt, FaDownload, FaEye, FaTrash } from 'react-icons/fa';

interface ImportJob {
  id: string;
  type: 'import' | 'export';
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  error_message?: string;
  created_at: string;
}

interface ImportStats {
  total: number;
  created: number;
  updated: number;
  errors: number;
}

export default function ImportExportPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.push('/login');
      return;
    }
    fetchJobs();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Poll for job updates if there's a processing job
    const interval = setInterval(() => {
      if (jobs.some(job => job.status === 'processing')) {
        fetchJobs();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobs]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/import-export');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/import-export', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSelectedFile(null);
        setUploadProgress(100);
        
        // Show success message
        alert(`Импорт завершен успешно!\nСоздано: ${result.stats.created}\nОбновлено: ${result.stats.updated}\nОшибок: ${result.stats.errors}`);
        
        fetchJobs();
      } else {
        alert(`Ошибка импорта: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        artikul: 'ART001',
        name: 'Пример товара 1',
        description: 'Описание товара',
        price: 100.00,
        salePrice: 90.00,
        stock: 50,
        sku: 'SKU001',
        catalogNumber: 'CAT001',
        category: 'Электроника',
        isActive: true,
        isFeatured: false
      },
      {
        artikul: 'ART002',
        name: 'Пример товара 2',
        description: 'Описание товара 2',
        price: 200.00,
        salePrice: null,
        stock: 25,
        sku: 'SKU002',
        catalogNumber: 'CAT002',
        category: 'Механика',
        isActive: true,
        isFeatured: true
      }
    ];

    const csvContent = [
      'artikul,name,description,price,salePrice,stock,sku,catalogNumber,category,isActive,isFeatured',
      ...template.map(item => 
        `${item.artikul},"${item.name}","${item.description}",${item.price},${item.salePrice || ''},${item.stock},${item.sku},${item.catalogNumber},"${item.category}",${item.isActive},${item.isFeatured}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProducts = async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      const response = await fetch(`/api/1c-exchange?action=get_products&format=${format}`);
      
      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Ошибка экспорта');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⟳';
      case 'failed':
        return '✗';
      default:
        return '⏳';
    }
  };

  const getProgressPercentage = (job: ImportJob) => {
    if (job.total_items === 0) return 0;
    return Math.round((job.processed_items / job.total_items) * 100);
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Импорт/Экспорт товаров</h1>
          <p className="text-gray-300">Управление импортом и экспортом товаров из Excel, CSV и JSON файлов</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Import Section */}
          <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">📥 Импорт товаров</h2>
            
            {/* Template Download */}
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Шаблон для импорта</h3>
              <p className="text-gray-300 text-sm mb-3">
                Скачайте шаблон Excel/CSV файла для правильного формата данных
              </p>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <FaDownload />
                Скачать шаблон
              </button>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Выберите файл (XLSX, XLS, CSV, JSON)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              
              {selectedFile && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">
                    Выбран файл: {selectedFile.name}
                  </p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaUpload />
                {isUploading ? 'Импортирование...' : 'Начать импорт'}
              </button>

              {/* Upload Progress */}
              {isUploading && uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Прогресс загрузки</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Import Info */}
            <div className="mt-6 p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">ℹ️ Как работает импорт</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Товары проверяются по артикулу</li>
                <li>• Если товар существует - обновляется</li>
                <li>• Если товар не найден - создается новый</li>
                <li>• Категории создаются автоматически</li>
                <li>• Поддерживаются форматы: XLSX, XLS, CSV, JSON</li>
              </ul>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-[#1e293b] rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">📤 Экспорт товаров</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Экспорт в разных форматах</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Выберите формат для экспорта всех товаров
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => exportProducts('csv')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                  >
                    <FaDownload />
                    Экспорт в CSV
                  </button>
                  
                  <button
                    onClick={() => exportProducts('json')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <FaDownload />
                    Экспорт в JSON
                  </button>
                  
                  <button
                    onClick={() => exportProducts('xlsx')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    <FaDownload />
                    Экспорт в Excel
                  </button>
                </div>
              </div>

              {/* 1C Integration */}
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">🔄 1C ERP Интеграция</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Используйте 1C ERP интеграцию для автоматической синхронизации
                </p>
                <button
                  onClick={() => router.push('/admin/1c-integration')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                >
                  <FaEye />
                  Открыть 1C Интеграцию
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="mt-8 bg-[#1e293b] rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">📋 История импорта/экспорта</h2>
          
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <FaFileAlt className="mx-auto text-gray-400 text-4xl mb-4" />
                <p className="text-gray-400">История импорта/экспорта пуста</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-600 rounded-lg p-4 hover:bg-gray-500/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FaFileAlt className="text-gray-400" />
                      <div>
                        <h3 className="font-medium text-white">{job.file_name}</h3>
                        <p className="text-sm text-gray-400">
                          {new Date(job.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)} {job.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {job.status === 'processing' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Прогресс</span>
                        <span>{getProgressPercentage(job)}% ({job.processed_items}/{job.total_items})</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(job)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  {(job.created_count > 0 || job.updated_count > 0 || job.error_count > 0) && (
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-green-400 font-bold">{job.created_count}</div>
                        <div className="text-gray-400 text-xs">Создано</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">{job.updated_count}</div>
                        <div className="text-gray-400 text-xs">Обновлено</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-bold">{job.error_count}</div>
                        <div className="text-gray-400 text-xs">Ошибок</div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {job.error_message && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400">{job.error_message}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 