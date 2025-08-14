'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { FaDownload, FaFileExcel, FaFileCsv, FaFileCode, FaDatabase, FaSync, FaCheck, FaTimes } from 'react-icons/fa';

interface ExportJob {
  id: number;
  type: string;
  status: string;
  created_at: string;
  file_url?: string;
  error_message?: string;
}

export default function Admin1CExport() {
  const { isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'xml' | 'csv' | 'xlsx'>('json');
  const [selectedData, setSelectedData] = useState<'catalog' | 'offers' | 'orders' | 'classifier'>('catalog');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchExportJobs();
  }, [isAuthenticated, isAdmin, router]);

  const fetchExportJobs = async () => {
    try {
      const response = await fetch('/api/1c-exchange?action=get_export_jobs');
      if (response.ok) {
        const data = await response.json();
        setExportJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Ошибка получения заданий экспорта:', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/1c-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export_data',
          data_type: selectedData,
          format: selectedFormat
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Экспорт успешно завершен! Файл: ${data.file_name}`);
        fetchExportJobs();
      } else {
        const error = await response.json();
        alert(`Ошибка экспорта: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка экспорта данных');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (jobId: number, fileUrl: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${selectedData}_${Date.now()}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      alert('Ошибка скачивания файла');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="text-green-500" />;
      case 'failed':
        return <FaTimes className="text-red-500" />;
      case 'processing':
        return <FaSync className="text-blue-500 animate-spin" />;
      default:
        return <FaDatabase className="text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершено';
      case 'failed':
        return 'Ошибка';
      case 'processing':
        return 'Обработка';
      default:
        return 'Ожидание';
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          CommerceML 2.05 Экспорт
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Экспорт данных по стандарту CommerceML 2.05 для интеграции с 1C
        </p>
      </div>

      {/* Export Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Настройки экспорта
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тип данных
            </label>
            <select
              value={selectedData}
              onChange={(e) => setSelectedData(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
                             <option value="catalog">Каталог товаров</option>
               <option value="offers">Коммерческие предложения</option>
               <option value="orders">Заказы</option>
               <option value="classifier">Классификатор</option>
            </select>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Формат файла
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6">
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <FaSync className="mr-2 animate-spin" />
            ) : (
              <FaDownload className="mr-2" />
            )}
            {loading ? 'Экспорт...' : 'Начать экспорт'}
          </button>
        </div>
      </div>

      {/* Export Jobs History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          История экспорта
        </h2>
        
        {exportJobs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Нет заданий экспорта
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {exportJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      #{job.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {job.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(job.status)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {getStatusText(job.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(job.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {job.status === 'completed' && job.file_url && (
                        <button
                          onClick={() => downloadFile(job.id, job.file_url!)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FaDownload className="h-4 w-4" />
                        </button>
                      )}
                      {job.status === 'failed' && job.error_message && (
                        <span className="text-red-600 dark:text-red-400 text-xs">
                          {job.error_message}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* API Documentation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          API для CommerceML 2.05 интеграции
        </h2>
        
        <div className="space-y-4">
                     <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
             <h3 className="font-medium text-gray-900 dark:text-white mb-2">
               Получение каталога товаров
             </h3>
             <code className="text-sm text-gray-600 dark:text-gray-400">
               GET /api/1c-exchange?action=get_catalog&format=xml
             </code>
           </div>
           
           <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
             <h3 className="font-medium text-gray-900 dark:text-white mb-2">
               Получение коммерческих предложений
             </h3>
             <code className="text-sm text-gray-600 dark:text-gray-400">
               GET /api/1c-exchange?action=get_offers&format=xml
             </code>
           </div>
           
           <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
             <h3 className="font-medium text-gray-900 dark:text-white mb-2">
               Получение классификатора
             </h3>
             <code className="text-sm text-gray-600 dark:text-gray-400">
               GET /api/1c-exchange?action=get_classifier&format=xml
             </code>
           </div>
        </div>
      </div>
    </div>
  );
}
