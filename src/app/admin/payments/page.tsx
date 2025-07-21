export const metadata = {
  title: "Ödənişlər — Sado-Parts",
  description: "Admin paneldə ödənişlərin idarə olunması və izlənməsi.",
};

export default function PaymentsPage() {
  // Mock data (realda backend API-dən alınacaq)
  const payments = [
    {
      id: 1,
      orderNumber: "ORD-2024-001",
      customer: "İvan Петров",
      amount: 25058,
      status: "paid",
      method: "card",
      date: "2024-07-20 10:30:00"
    },
    {
      id: 2,
      orderNumber: "ORD-2024-002",
      customer: "Мария Сидорова",
      amount: 3720,
      status: "paid",
      method: "card",
      date: "2024-07-19 15:45:00"
    },
    {
      id: 3,
      orderNumber: "ORD-2024-005",
      customer: "Дмитрий Соколов",
      amount: 5720,
      status: "refunded",
      method: "card",
      date: "2024-07-16 14:25:00"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white p-8">
      <h1 className="text-4xl font-bold mb-8 neon-text">Ödənişlər</h1>
      <div className="bg-white/10 rounded-xl p-6 shadow-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2">Sifariş №</th>
              <th className="px-4 py-2">Müştəri</th>
              <th className="px-4 py-2">Məbləğ</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Ödəniş üsulu</th>
              <th className="px-4 py-2">Tarix</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} className="border-b border-gray-700">
                <td className="px-4 py-2">{payment.orderNumber}</td>
                <td className="px-4 py-2">{payment.customer}</td>
                <td className="px-4 py-2">{payment.amount.toLocaleString()} ₽</td>
                <td className="px-4 py-2">
                  {payment.status === 'paid' ? (
                    <span className="bg-green-600 text-white px-2 py-1 rounded">Ödənilib</span>
                  ) : (
                    <span className="bg-red-600 text-white px-2 py-1 rounded">Qaytarılıb</span>
                  )}
                </td>
                <td className="px-4 py-2">{payment.method === 'card' ? 'Kart' : payment.method}</td>
                <td className="px-4 py-2">{payment.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
} 