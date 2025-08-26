'use client';

export default function PartsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Запчасти</h1>
        <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
          <p className="text-lg mb-6 text-gray-700">
            Широкий ассортимент запчастей для вилочных погрузчиков всех марок.
          </p>
          <p className="text-lg text-gray-700">
            Оригинальные и совместимые запчасти по доступным ценам.
          </p>
        </div>
      </div>
    </main>
  );
}
