'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function P2PPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      try {
        // Get payment info
        const pRes = await fetch(`/api/payments?action=get_payment&id=${paymentId}`, { cache: 'no-store' });
        const pData = await pRes.json();
        if (!pRes.ok || !pData.success) {
          throw new Error(pData.error || 'Платеж не найден');
        }
        setPayment(pData.payment);

        // Get requisites from settings (card number, holder name optional)
        const sRes = await fetch('/api/admin/settings', { cache: 'no-store' });
        const sData = await sRes.json();
        setSettings(sData.settings || {});
      } catch (e: any) {
        setError(e.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    if (paymentId) load();
  }, [paymentId]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Скопировано');
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">Загрузка...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
    );
  }

  const amount = payment?.total_amount || payment?.amount || 0;
  const cardNumber = settings.p2pCardNumber || '0000 0000 0000 0000';
  const cardHolder = settings.p2pCardHolder || 'IVAN IVANOV';
  const bankName = settings.p2pBankName || 'Bank';

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">P2P перевод (карта)</h1>
        <p className="text-gray-600 mb-6">Оплатите переводом с карты на карту и приложите комментарий к платежу.</n+p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="text-sm text-gray-600">Сумма к оплате</div>
              <div className="text-xl font-semibold">{Number(amount).toFixed(2)} ₽</div>
            </div>
          </div>

          <div className="p-3 border rounded">
            <div className="text-sm text-gray-600">Номер карты для перевода</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-lg font-mono">{cardNumber}</div>
              <button onClick={() => copy(cardNumber)} className="px-3 py-1 bg-blue-600 text-white rounded">Копировать</button>
            </div>
            <div className="text-sm text-gray-600 mt-2">Владелец карты: {cardHolder}</div>
            <div className="text-sm text-gray-600">Банк: {bankName}</div>
          </div>

          <div className="p-3 border rounded">
            <div className="text-sm text-gray-600">Комментарий к переводу</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-lg font-mono">PAY-{paymentId}</div>
              <button onClick={() => copy(`PAY-${paymentId}`)} className="px-3 py-1 bg-blue-600 text-white rounded">Копировать</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Укажите этот комментарий, чтобы мы быстро идентифицировали платеж.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push('/profile?tab=orders')} className="px-4 py-2 bg-green-600 text-white rounded">Я оплатил(а)</button>
            <button onClick={() => router.push('/cart')} className="px-4 py-2 bg-gray-200 rounded">Вернуться в корзину</button>
          </div>
        </div>
      </div>
    </div>
  );
}


