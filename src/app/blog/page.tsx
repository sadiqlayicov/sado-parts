export const metadata = {
  title: "Блог — Bilal-Parts",
  description: "Блог Bilal-Parts: экспертные статьи, советы по ремонту и обслуживанию вилочных погрузчиков, новости отрасли.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Блог</h1>
        <div className="grid gap-8 md:grid-cols-2">
          <article className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">Как выбрать запчасти для вилочного погрузчика?</h2>
            <p className="mb-4 text-gray-600">Экспертные советы по подбору оригинальных и аналоговых деталей для вашей техники.</p>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Читать далее</a>
          </article>
          <article className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">AR/VR в подборе запчастей</h2>
            <p className="mb-4 text-gray-600">Инновационные технологии для удобного выбора и визуализации деталей.</p>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Читать далее</a>
          </article>
        </div>
      </div>
    </main>
  );
} 