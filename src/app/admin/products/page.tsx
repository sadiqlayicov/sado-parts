'use client';

import { useState, useEffect } from 'react';

export default function ProductsPage() {
  const [test, setTest] = useState('Test');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Test Səhifəsi
        </h1>
        <p className="text-gray-600">Bu sadə test səhifəsidir</p>
        <div className="mt-4 p-4 bg-white rounded-lg">
          <p>Test dəyəri: {test}</p>
          <button 
            onClick={() => setTest('Dəyişdirildi')}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Dəyişdir
          </button>
        </div>
      </div>
    </div>
  );
} 