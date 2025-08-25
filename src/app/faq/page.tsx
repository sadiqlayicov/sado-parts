'use client';

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Часто задаваемые вопросы</h1>
        <div className="bg-[#1e293b] rounded-xl p-8">
          <p className="text-lg mb-6">
            Ответы на наиболее часто задаваемые вопросы о наших услугах и продуктах.
          </p>
          <p className="text-lg">
            Если вы не нашли ответ на свой вопрос, свяжитесь с нашей службой поддержки.
          </p>
        </div>
      </div>
    </main>
  );
}
