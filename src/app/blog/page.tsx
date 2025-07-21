export const metadata = {
  title: "Блог — Sado-Parts",
  description: "Блог Sado-Parts: экспертные статьи, советы по ремонту и обслуживанию вилочных погрузчиков, новости отрасли.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <h1 className="text-4xl font-bold mb-8 neon-text">Блог</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <article className="bg-white/10 rounded-xl p-6 shadow-lg hover:scale-105 transition">
          <h2 className="text-2xl font-semibold mb-2">Как выбрать запчасти для вилочного погрузчика?</h2>
          <p className="mb-4">Экспертные советы по подбору оригинальных и аналоговых деталей для вашей техники.</p>
          <a href="#" className="text-cyan-400 hover:underline">Читать далее</a>
        </article>
        <article className="bg-white/10 rounded-xl p-6 shadow-lg hover:scale-105 transition">
          <h2 className="text-2xl font-semibold mb-2">AR/VR в подборе запчастей</h2>
          <p className="mb-4">Инновационные технологии для удобного выбора и визуализации деталей.</p>
          <a href="#" className="text-cyan-400 hover:underline">Читать далее</a>
        </article>
      </div>
    </main>
  );
} 