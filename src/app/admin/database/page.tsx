"use client";
import { useEffect, useState } from "react";
import { FaDatabase, FaTools, FaClock } from 'react-icons/fa';

export default function AdminDatabasePage() {
  const [database, setDatabase] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Məlumat Bazası
          </h1>
          <p className="text-gray-600">Məlumat bazası idarəetmə və texniki xidmətlər</p>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Məlumat bazası yoxlanılır...</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-6">
                <FaDatabase className="text-6xl text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Məlumat Bazası Funksiyası
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Məlumat bazası idarəetmə funksiyası hazırlanır və tezliklə istifadəyə veriləcək
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-sm mx-auto">
                <div className="flex items-center justify-center mb-3">
                  <FaClock className="text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">Tezliklə əlçatan olacaq</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Bu funksiya məlumat bazası yedəkləmə, bərpa və idarəetmə imkanları təqdim edəcək
                </p>
              </div>

              {/* Feature Preview */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <FaTools className="text-3xl text-gray-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Yedəkləmə</h4>
                  <p className="text-gray-600 text-sm">Məlumat bazasının avtomatik yedəklənməsi</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <FaDatabase className="text-3xl text-gray-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Bərpa</h4>
                  <p className="text-gray-600 text-sm">Məlumatların təhlükəsiz bərpası</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <FaTools className="text-3xl text-gray-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">İdarəetmə</h4>
                  <p className="text-gray-600 text-sm">Məlumat bazası performansının izlənilməsi</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
