'use client';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Условия использования</h1>
        <div className="bg-[#1e293b] rounded-xl p-8">
          <p className="text-lg mb-6">
            Используя наш сайт, вы соглашаетесь с условиями использования.
          </p>
          <p className="text-lg">
            Подробная информация о правилах использования нашего сервиса.
          </p>
        </div>
      </div>
    </main>
  );
}
