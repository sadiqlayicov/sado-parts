'use client';

export default function RentalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Аренда погрузчиков</h1>
        <div className="bg-[#1e293b] rounded-xl p-8">
          <p className="text-lg mb-6">
            Предлагаем услуги аренды вилочных погрузчиков для вашего бизнеса.
          </p>
          <p className="text-lg">
            Гибкие условия аренды и профессиональное обслуживание техники.
          </p>
        </div>
      </div>
    </main>
  );
}
