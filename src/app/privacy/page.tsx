'use client';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Политика конфиденциальности</h1>
        <div className="bg-[#1e293b] rounded-xl p-8">
          <p className="text-lg mb-6">
            Мы уважаем вашу конфиденциальность и обязуемся защищать вашу личную информацию.
          </p>
          <p className="text-lg">
            Подробная информация о том, как мы собираем, используем и защищаем ваши данные.
          </p>
        </div>
      </div>
    </main>
  );
}
