'use client';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">О нас</h1>
        <div className="bg-[#1e293b] rounded-xl p-8">
          <p className="text-lg mb-6">
            Bilal-parts - это ведущий поставщик запчастей для вилочных погрузчиков в Москве. 
            Мы специализируемся на предоставлении высококачественных деталей для всех основных 
            брендов погрузчиков.
          </p>
          <p className="text-lg mb-6">
            Наша миссия - обеспечить наших клиентов надежными и качественными запчастями, 
            которые помогут поддерживать их оборудование в отличном рабочем состоянии.
          </p>
          <p className="text-lg">
            С 2008 года мы заслужили репутацию надежного партнера в сфере поставок 
            запчастей для складской техники.
          </p>
        </div>
      </div>
    </main>
  );
}
