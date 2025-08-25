'use client';

export default function PartsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Запчасти</h1>
        <div className="bg-[#1e293b] rounded-xl p-8">
          <p className="text-lg mb-6">
            Широкий ассортимент запчастей для вилочных погрузчиков всех марок.
          </p>
          <p className="text-lg">
            Оригинальные и совместимые запчасти по доступным ценам.
          </p>
        </div>
      </div>
    </main>
  );
}
