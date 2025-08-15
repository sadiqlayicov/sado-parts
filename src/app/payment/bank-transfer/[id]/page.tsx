'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';
import { FaPrint, FaCopy, FaCheck, FaArrowLeft, FaDownload } from 'react-icons/fa';

function ReceiptUploader({ paymentId }: { paymentId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      const base64 = await toBase64(file);
      const res = await fetch('/api/payments?action=upload_receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: Number(paymentId), receiptImage: base64 })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Квитанция загружена. Мы проверим оплату в ближайшее время.');
      } else {
        setMessage(data.error || 'Ошибка загрузки');
      }
    } catch (e: any) {
      setMessage(e.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={!file || uploading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
        {uploading ? 'Загрузка...' : 'Загрузить квитанцию'}
      </button>
      {message && <p className="text-sm text-gray-700">{message}</p>}
    </div>
  );
}

interface BankDetails {
  name: string;
  account: string;
  bank: string;
  bik: string;
  correspondent: string;
  inn: string;
  kpp: string;
  address: string;
}

interface Payment {
  id: number;
  amount: number;
  total_amount: number;
  payment_system: string;
  status: string;
  created_at: string;
}

export default function BankTransferPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const paymentId = params.id as string;
    if (paymentId) {
      fetchPaymentDetails(paymentId);
      fetchBankDetails();
    }
  }, [isAuthenticated, router, params]);

  const fetchPaymentDetails = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments?action=get_payment&id=${paymentId}`);
      if (response.ok) {
        const data = await response.json();
        setPayment(data.payment);
      } else {
        alert('Платеж не найден');
        router.push('/payment');
      }
    } catch (error) {
      console.error('Ошибка получения платежа:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const response = await fetch('/api/payments?action=get_bank_details');
      if (response.ok) {
        const data = await response.json();
        setBankDetails(data.bankDetails);
      }
    } catch (error) {
      console.error('Ошибка получения банковских реквизитов:', error);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
  };

  const printBankDetails = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && bankDetails && payment) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Банковские реквизиты для оплаты</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .details { border: 2px solid #000; padding: 20px; margin: 20px 0; }
              .row { display: flex; margin: 10px 0; }
              .label { font-weight: bold; width: 200px; }
              .value { flex: 1; }
              .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Банковские реквизиты для оплаты</h1>
              <p>Заказ №${payment.id} | Сумма: ${payment.total_amount} ₽</p>
            </div>
            <div class="details">
              <div class="row">
                <div class="label">Получатель:</div>
                <div class="value">${bankDetails.name}</div>
              </div>
              <div class="row">
                <div class="label">ИНН:</div>
                <div class="value">${bankDetails.inn}</div>
              </div>
              <div class="row">
                <div class="label">КПП:</div>
                <div class="value">${bankDetails.kpp}</div>
              </div>
              <div class="row">
                <div class="label">Банк:</div>
                <div class="value">${bankDetails.bank}</div>
              </div>
              <div class="row">
                <div class="label">БИК:</div>
                <div class="value">${bankDetails.bik}</div>
              </div>
              <div class="row">
                <div class="label">Корр. счет:</div>
                <div class="value">${bankDetails.correspondent}</div>
              </div>
              <div class="row">
                <div class="label">Расчетный счет:</div>
                <div class="value">${bankDetails.account}</div>
              </div>
              <div class="row">
                <div class="label">Адрес:</div>
                <div class="value">${bankDetails.address}</div>
              </div>
            </div>
            <div class="amount">
              Сумма к оплате: ${payment.total_amount} ₽
            </div>
            <div class="footer">
              <p>После оплаты пришлите копию платежного поручения на email: payments@sado-parts.ru</p>
              <p>В назначении платежа укажите: "Оплата заказа №${payment.id}"</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadBankDetails = () => {
    if (!bankDetails || !payment) return;

    const content = `Банковские реквизиты для оплаты

Заказ №${payment.id}
Сумма к оплате: ${payment.total_amount} ₽

Получатель: ${bankDetails.name}
ИНН: ${bankDetails.inn}
КПП: ${bankDetails.kpp}
Банк: ${bankDetails.bank}
БИК: ${bankDetails.bik}
Корр. счет: ${bankDetails.correspondent}
Расчетный счет: ${bankDetails.account}
Адрес: ${bankDetails.address}

В назначении платежа укажите: "Оплата заказа №${payment.id}"
После оплаты пришлите копию платежного поручения на email: payments@sado-parts.ru`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bank_details_order_${payment.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!payment || !bankDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Ошибка загрузки данных</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Назад
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Банковский перевод
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Реквизиты для оплаты заказа №{payment.id}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bank rekvizitləri */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Банковские реквизиты
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Получатель</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bankDetails.name}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.name, 'name')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copied === 'name' ? <FaCheck /> : <FaCopy />}
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">ИНН</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bankDetails.inn}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.inn, 'inn')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copied === 'inn' ? <FaCheck /> : <FaCopy />}
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">КПП</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bankDetails.kpp}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.kpp, 'kpp')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copied === 'kpp' ? <FaCheck /> : <FaCopy />}
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Банк</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bankDetails.bank}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.bank, 'bank')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copied === 'bank' ? <FaCheck /> : <FaCopy />}
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">БИК</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bankDetails.bik}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.bik, 'bik')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copied === 'bik' ? <FaCheck /> : <FaCopy />}
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Корр. счет</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bankDetails.correspondent}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.correspondent, 'correspondent')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copied === 'correspondent' ? <FaCheck /> : <FaCopy />}
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Расчетный счет</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bankDetails.account}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.account, 'account')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copied === 'account' ? <FaCheck /> : <FaCopy />}
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Адрес</span>
                  <p className="font-medium text-gray-900 dark:text-white">{bankDetails.address}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.address, 'address')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copied === 'address' ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={printBankDetails}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FaPrint className="mr-2" />
                Печать
              </button>
              <button
                onClick={downloadBankDetails}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <FaDownload className="mr-2" />
                Скачать
              </button>
            </div>
          </div>

          {/* Ödəniş məlumatları */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Детали платежа
              </h2>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Номер заказа</span>
                  <p className="font-medium text-gray-900 dark:text-white">#{payment.id}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Сумма к оплате</span>
                  <p className="font-bold text-2xl text-blue-600">{payment.total_amount} ₽</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Дата создания</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(payment.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Способ оплаты</span>
                  <p className="font-medium text-gray-900 dark:text-white">Банковский перевод</p>
                </div>
              </div>
            </div>

            {/* Təlimatlar */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                Инструкция по оплате
              </h3>
              <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                <p>1. Скопируйте банковские реквизиты</p>
                <p>2. В вашем банке создайте платежное поручение</p>
                <p>3. В назначении платежа укажите: <strong>"Оплата заказа №{payment.id}"</strong></p>
                <p>4. После оплаты загрузите квитанцию об оплате ниже или пришлите на email: <strong>payments@sado-parts.ru</strong></p>
                <p>5. Мы подтвердим получение платежа и обновим статус заказа</p>
              </div>
            </div>

            {/* Təhlükəsizlik */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                Безопасность
              </h3>
              <div className="space-y-3 text-sm text-green-700 dark:text-green-300">
                <p>• Все платежи обрабатываются через защищенные банковские системы</p>
                <p>• Реквизиты проверены и актуальны</p>
                <p>• Подтверждение платежа происходит в течение 1-3 рабочих дней</p>
              </div>
            </div>
          </div>
          {/* Upload receipt section */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Загрузка квитанции</h2>
            <ReceiptUploader paymentId={String(params.id)} />
          </div>
        </div>
      </div>
    </div>
  );
}
