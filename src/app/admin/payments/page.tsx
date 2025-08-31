'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { FaCreditCard, FaCheck, FaTimes, FaSync, FaEye, FaUndo, FaDownload, FaFilter, FaTrash, FaCheckCircle, FaTrashAlt } from 'react-icons/fa';

interface Payment {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  currency: string;
  payment_system: string;
  status: string;
  transaction_id?: string;
  commission: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  error_message?: string;
  orderNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function AdminPayments() {
  const { isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSystem, setFilterSystem] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('');
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchPayments();
  }, [isAuthenticated, isAdmin, router]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments?action=get_payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Ошибка получения платежей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment || refundAmount <= 0) {
      alert('Введите корректную сумму возврата');
      return;
    }

    if (refundAmount > selectedPayment.total_amount) {
      alert('Сумма возврата не может превышать сумму платежа');
      return;
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refund_payment',
          paymentId: selectedPayment.id,
          amount: refundAmount,
          reason: refundReason
        }),
      });

      if (response.ok) {
        alert('Возврат средств успешно создан');
        setShowModal(false);
        setSelectedPayment(null);
        setRefundAmount(0);
        setRefundReason('');
        fetchPayments();
      } else {
        const error = await response.json();
        alert(`Ошибка возврата: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка возврата средств:', error);
      alert('Ошибка возврата средств');
    }
  };

  const handleApprovePayment = async (paymentId: number) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve_payment',
          paymentId: paymentId
        }),
      });

      if (response.ok) {
        alert('Платеж успешно подтвержден');
        fetchPayments();
      } else {
        const error = await response.json();
        alert(`Ошибка подтверждения: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка подтверждения платежа:', error);
      alert('Ошибка подтверждения платежа');
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот платеж?')) {
      return;
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete_payment',
          paymentId: paymentId
        }),
      });

      if (response.ok) {
        alert('Платеж успешно удален');
        fetchPayments();
      } else {
        const error = await response.json();
        alert(`Ошибка удаления: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка удаления платежа:', error);
      alert('Ошибка удаления платежа');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPayments.length === 0) {
      alert('Выберите платежи для удаления');
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить ${selectedPayments.length} платежей?`)) {
      return;
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk_delete_payments',
          paymentIds: selectedPayments
        }),
      });

      if (response.ok) {
        alert(`${selectedPayments.length} платежей успешно удалены`);
        setSelectedPayments([]);
        setSelectAll(false);
        fetchPayments();
      } else {
        const error = await response.json();
        alert(`Ошибка удаления: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
      alert('Ошибка массового удаления');
    }
  };

  const handleSelectPayment = (paymentId: number) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPayments([]);
      setSelectAll(false);
    } else {
      setSelectedPayments(filteredPayments.map(p => p.id));
      setSelectAll(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="text-green-500" />;
      case 'cancelled':
        return <FaTimes className="text-red-500" />;
      case 'pending':
        return <FaSync className="text-yellow-500 animate-spin" />;
      case 'refunded':
        return <FaUndo className="text-blue-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В ожидании';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      case 'refunded':
        return 'Возвращен';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentSystemIcon = (system: string) => {
    switch (system) {
      case 'sberbank':
        return '🏦';
      case 'yoomoney':
        return '💳';
      case 'qiwi':
        return '📱';
      case 'tinkoff':
        return '🔵';
      case 'alfa':
        return '🔴';
      case 'vtb':
        return '🔵';
      default:
        return '💳';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const statusMatch = filterStatus === 'all' || payment.status === filterStatus;
    const systemMatch = filterSystem === 'all' || payment.payment_system === filterSystem;
    return statusMatch && systemMatch;
  });

  const exportPayments = () => {
    const csvContent = [
      ['ID', 'Номер заказа', 'Клиент', 'Сумма', 'Система', 'Статус', 'Дата', 'Комиссия', 'Итого'],
      ...filteredPayments.map(payment => [
        payment.id,
        payment.orderNumber || '',
        `${payment.firstName || ''} ${payment.lastName || ''}`.trim(),
        payment.amount,
        payment.payment_system,
        payment.status,
        new Date(payment.created_at).toLocaleDateString('ru-RU'),
        payment.commission,
        payment.total_amount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Управление платежами
          </h1>
          <p className="text-gray-600">
            Просмотр и управление всеми платежами системы
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Фильтры:</span>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="all">Все статусы</option>
                <option value="pending">В ожидании</option>
                <option value="completed">Завершен</option>
                <option value="cancelled">Отменен</option>
                <option value="refunded">Возвращен</option>
              </select>

              <select
                value={filterSystem}
                onChange={(e) => setFilterSystem(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="all">Все системы</option>
                <option value="sberbank">Сбербанк</option>
                <option value="yoomoney">ЮMoney</option>
                <option value="qiwi">QIWI</option>
                <option value="tinkoff">Тинькофф</option>
                <option value="alfa">Альфа-Банк</option>
                <option value="vtb">ВТБ</option>
              </select>
            </div>

            <div className="flex gap-2">
              {selectedPayments.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <FaTrashAlt className="mr-2" />
                  Удалить выбранные ({selectedPayments.length})
                </button>
              )}
              <button
                onClick={exportPayments}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <FaDownload className="mr-2" />
                Экспорт
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <FaSync className="animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Загрузка платежей...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Заказ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Система
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPayments.includes(payment.id)}
                          onChange={() => handleSelectPayment(payment.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{payment.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.orderNumber || `#${payment.order_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {payment.firstName && payment.lastName 
                              ? `${payment.firstName} ${payment.lastName}`
                              : 'Не указан'
                            }
                          </div>
                          <div className="text-gray-500">
                            {payment.email || 'Нет email'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{payment.amount} ₽</div>
                          <div className="text-xs text-gray-500">
                            Комиссия: {payment.commission} ₽
                          </div>
                          <div className="text-xs font-medium text-blue-600">
                            Итого: {payment.total_amount} ₽
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getPaymentSystemIcon(payment.payment_system)}</span>
                          <span className="capitalize">{payment.payment_system}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(payment.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(payment.created_at).toLocaleDateString('ru-RU')}</div>
                          <div className="text-gray-500">
                            {new Date(payment.created_at).toLocaleTimeString('ru-RU')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Просмотр деталей"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => handleApprovePayment(payment.id)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Подтвердить платеж"
                            >
                              <FaCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {payment.status === 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setRefundAmount(payment.total_amount);
                                setShowModal(true);
                              }}
                              className="text-orange-600 hover:text-orange-900 transition-colors"
                              title="Возврат средств"
                            >
                              <FaUndo className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Удалить платеж"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredPayments.length === 0 && !loading && (
            <div className="p-8 text-center">
              <p className="text-gray-500">Платежи не найдены</p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedPayment.status === 'completed' ? 'Возврат средств' : 'Детали платежа'}
              </h3>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">ID платежа:</span>
                  <p className="font-medium">#{selectedPayment.id}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Сумма:</span>
                  <p className="font-medium">{selectedPayment.total_amount} ₽</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Система:</span>
                  <p className="font-medium">{selectedPayment.payment_system}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Статус:</span>
                  <p className="font-medium">{getStatusText(selectedPayment.status)}</p>
                </div>

                {selectedPayment.status === 'completed' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Сумма возврата (₽)
                      </label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        max={selectedPayment.total_amount}
                        min={0}
                        step={0.01}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Причина возврата
                      </label>
                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Укажите причину возврата..."
                      />
                    </div>
                  </>
                )}

                {selectedPayment.error_message && (
                  <div>
                    <span className="text-sm text-gray-600">Ошибка:</span>
                    <p className="text-red-600 text-sm">{selectedPayment.error_message}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                {selectedPayment.status === 'completed' && (
                  <button
                    onClick={handleRefund}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    Возврат
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPayment(null);
                    setRefundAmount(0);
                    setRefundReason('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 