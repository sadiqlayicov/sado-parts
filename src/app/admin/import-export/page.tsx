'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { FaDownload, FaUpload, FaFileExcel, FaFileCsv, FaFileAlt, FaExternalLinkAlt } from 'react-icons/fa';

export default function ImportExportPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user?.isAdmin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Пожалуйста, выберите файл для импорта');
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/import-export', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        alert('Импорт успешно завершен!');
        setSelectedFile(null);
      } else {
        alert(`Ошибка импорта: ${result.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Произошла ошибка при импорте');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    setExportLoading(true);
    try {
      const response = await fetch(`/api/import-export?format=${format}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Ошибка при экспорте');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Произошла ошибка при экспорте');
    } finally {
      setExportLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple template
    const template = [
      ['name', 'category', 'artikul', 'catalogNumber', 'description', 'price', 'stock'],
      ['Пример товара', 'Категория', 'ART001', 'CAT001', 'Описание товара', '1000', '10']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Импорт/Экспорт товаров</h1>
          <p className="text-gray-600">Управление импортом и экспортом товаров из Excel, CSV и JSON файлов</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Import Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Импорт товаров</h2>
            
            {/* Template Download */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Шаблон для импорта</h3>
              <p className="text-gray-600 mb-4">Скачайте шаблон Excel/CSV файла для правильного формата данных</p>
              <button
                onClick={downloadTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center"
              >
                <FaDownload className="mr-2" />
                Скачать шаблон
              </button>
            </div>

            {/* File Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Выберите файл</h3>
              <p className="text-gray-600 mb-4">Выберите файл (XLSX, XLS, CSV, JSON)</p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center"
                >
                  <FaUpload className="mr-2" />
                  Выберите файл
                </button>
                <span className="text-gray-600">
                  {selectedFile ? selectedFile.name : 'Файл не выбран'}
                </span>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={!selectedFile || importLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center"
            >
              {importLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Импорт...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Начать импорт
                </>
              )}
            </button>

            {/* Import Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Как работает импорт</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Товары проверяются по артикулу</li>
                <li>• Если товар существует - обновляется</li>
                <li>• Если товар не существует - создается новый</li>
                <li>• Поддерживаются форматы: XLSX, XLS, CSV, JSON</li>
              </ul>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                importResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.message}
                </div>
                {importResult.stats && (
                  <div className="text-sm text-gray-600 mt-2">
                    <div>Обновлено: {importResult.stats.updated}</div>
                    <div>Создано: {importResult.stats.created}</div>
                    <div>Ошибок: {importResult.stats.errors}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Экспорт товаров</h2>
            
            {/* Export Formats */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Экспорт в разных форматах</h3>
              <p className="text-gray-600 mb-4">Выберите формат для экспорта всех товаров</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exportLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center"
                >
                  <FaFileCsv className="mr-2" />
                  Экспорт в CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={exportLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center"
                >
                  <FaFileAlt className="mr-2" />
                  Экспорт в JSON
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  disabled={exportLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center"
                >
                  <FaFileExcel className="mr-2" />
                  Экспорт в Excel
                </button>
              </div>
            </div>

            {/* 1C Integration */}
            <div className="mt-8 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">1C ERP Интеграция</h3>
              <p className="text-gray-600 mb-4">Используйте 1C ERP интеграцию для автоматической синхронизации</p>
              <button
                onClick={() => router.push('/admin/1c-integration')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center"
              >
                <FaExternalLinkAlt className="mr-2" />
                Открыть 1С Интеграцию
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 