export const metadata = {
  title: "Контакты — Sado-Parts",
  description: "Контакты интернет-магазина Sado-Parts: адрес в Москве, телефоны, email, форма обратной связи.",
};

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <h1 className="text-4xl font-bold mb-8 neon-text">Контакты</h1>
      <div className="mb-8">
        <p className="mb-2">Адрес: г. Москва, ул. Примерная, д. 1</p>
        <p className="mb-2">Телефон: <a href="tel:+74951234567" className="text-cyan-400 hover:underline">+7 (495) 123-45-67</a></p>
        <p className="mb-2">Email: <a href="mailto:info@sado-parts.ru" className="text-cyan-400 hover:underline">info@sado-parts.ru</a></p>
      </div>
      <form className="flex flex-col gap-4 max-w-xl">
        <input type="text" placeholder="Ваше имя" className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" required />
        <input type="email" placeholder="Ваш email" className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" required />
        <textarea placeholder="Ваше сообщение" className="px-6 py-3 rounded-lg text-black text-lg outline-none focus:ring-2 focus:ring-cyan-400 transition" rows={4} required />
        <button type="submit" className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition">Отправить</button>
      </form>
    </main>
  );
} 