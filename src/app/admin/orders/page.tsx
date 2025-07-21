'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { 
  FaShoppingCart, 
  FaSearch, 
  FaFilter,
  FaEye,
  FaEdit,
  FaPrint,
  FaTruck,
  FaCheck,
  FaTimes,
  FaClock,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaCreditCard,
  FaBox,
  FaStar,
  FaDownload,
  FaFileExport,
  FaFileImport,
  FaList,
  FaPlus
} from 'react-icons/fa';

export default function OrdersManagement() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  useEffect(() => {
    const mockOrders = [
      {
        id: 1,
        orderNumber: "ORD-2024-001",
        customer: {
          name: "Иван Петров",
          email: "ivan@example.com",
          phone: "+7 (999) 123-45-67",
          address: "г. Москва, ул. Примерная, д. 1, кв. 5"
        },
        items: [
          {
            id: 1,
            name: "Поршень двигателя Toyota 2.5L",
            sku: "TOY-2.5-PISTON",
            quantity: 2,
            price: 12500,
            total: 25000
          },
          {
            id: 2,
            name: "Масляный фильтр Komatsu",
            sku: "KOM-OIL-FILTER",
            quantity: 1,
            price: 850,
            total: 850
          }
        ],
        status: "new",
        paymentStatus: "paid",
        paymentMethod: "card",
        subtotal: 25850,
        discount: 1292,
        shipping: 500,
        total: 25058,
        createdAt: "2024-07-20T10:30:00",
        updatedAt: "2024-07-20T10:30:00",
        notes: "Срочный заказ, нужен быстрый срок доставки"
      },
      {
        id: 2,
        orderNumber: "ORD-2024-002",
        customer: {
          name: "Мария Сидорова",
          email: "maria@example.com",
          phone: "+7 (999) 234-56-78",
          address: "г. Санкт-Петербург, ул. Тестовая, д. 2, кв. 10"
        },
        items: [
          {
            id: 3,
            name: "Воздушный фильтр Nissan",
            sku: "NIS-AIR-FILTER",
            quantity: 3,
            price: 1200,
            total: 3600
          }
        ],
        status: "processing",
        paymentStatus: "paid",
        paymentMethod: "card",
        subtotal: 3600,
        discount: 180,
        shipping: 300,
        total: 3720,
        createdAt: "2024-07-19T15:45:00",
        updatedAt: "2024-07-20T09:15:00",
        notes: ""
      },
      {
        id: 3,
        orderNumber: "ORD-2024-003",
        customer: {
          name: "Алексей Козлов",
          email: "alex@example.com",
          phone: "+7 (999) 345-67-89",
          address: "г. Екатеринбург, ул. Новая, д. 3, кв. 15"
        },
        items: [
          {
            id: 4,
            name: "Топливный насос Mitsubishi",
            sku: "MIT-FUEL-PUMP",
            quantity: 1,
            price: 18500,
            total: 18500
          },
          {
            id: 5,
            name: "Турбина Garrett",
            sku: "GAR-TURBO",
            quantity: 1,
            price: 45000,
            total: 45000
          }
        ],
        status: "shipped",
        paymentStatus: "paid",
        paymentMethod: "card",
        subtotal: 63500,
        discount: 3175,
        shipping: 800,
        total: 61125,
        createdAt: "2024-07-18T12:20:00",
        updatedAt: "2024-07-19T14:30:00",
        notes: "Доставка до терминала"
      },
      {
        id: 4,
        orderNumber: "ORD-2024-004",
        customer: {
          name: "Елена Воробьева",
          email: "elena@example.com",
          phone: "+7 (999) 456-78-90",
          address: "г. Новосибирск, ул. Центральная, д. 4, кв. 8"
        },
        items: [
          {
            id: 6,
            name: "Ремень ГРМ Toyota",
            sku: "TOY-TIMING-BELT",
            quantity: 1,
            price: 3200,
            total: 3200
          }
        ],
        status: "completed",
        paymentStatus: "paid",
        paymentMethod: "card",
        subtotal: 3200,
        discount: 160,
        shipping: 300,
        total: 3340,
        createdAt: "2024-07-17T09:10:00",
        updatedAt: "2024-07-18T16:45:00",
        notes: ""
      },
      {
        id: 5,
        orderNumber: "ORD-2024-005",
        customer: {
          name: "Дмитрий Соколов",
          email: "dmitry@example.com",
          phone: "+7 (999) 567-89-01",
          address: "г. Казань, ул. Рабочая, д. 5, кв. 12"
        },
        items: [
          {
            id: 7,
            name: "Клапан впускной Komatsu",
            sku: "KOM-INTAKE-VALVE",
            quantity: 2,
            price: 2800,
            total: 5600
          }
        ],
        status: "cancelled",
        paymentStatus: "refunded",
        paymentMethod: "card",
        subtotal: 5600,
        discount: 280,
        shipping: 400,
        total: 5720,
        createdAt: "2024-07-16T14:25:00",
        updatedAt: "2024-07-17T11:30:00",
        notes: "Отменен по просьбе клиента"
      }
    ];
    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  }, []);

  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const orderDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= monthAgo;
          });
          break;
      }
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'processing': return 'В обработке';
      case 'shipped': return 'Отправлен';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'refunded': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Оплачен';
      case 'pending': return 'Ожидает оплаты';
      case 'refunded': return 'Возврат';
      default: return 'Неизвестно';
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        : order
    ));
    setIsLoading(false);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Управление заказами</h1>
          <p className="text-gray-600 dark:text-gray-400">Управление заказами и их статусами</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center">
            <FaPlus className="mr-2" />
            Создать заказ
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center">
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Поиск
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Номер заказа, клиент..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="new">Новые</option>
              <option value="processing">В обработке</option>
              <option value="shipped">Отправленные</option>
              <option value="completed">Выполненные</option>
              <option value="cancelled">Отмененные</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Период
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все время</option>
              <option value="today">Сегодня</option>
              <option value="week">За неделю</option>
              <option value="month">За месяц</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center">
              <FaFilter className="mr-2" />
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Заказ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Оплата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {order.items.length} товар(ов)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customer.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {order.customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.total.toLocaleString()} ₽
                    </div>
                    {order.discount > 0 && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Скидка: {order.discount.toLocaleString()} ₽
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {getPaymentStatusText(order.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                    <div className="text-xs">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
                        <FaPrint className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Заказ {selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Информация о клиенте</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaUser className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedOrder.customer.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedOrder.customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaPhone className="h-4 w-4 text-gray-400 mr-3" />
                      <p className="text-sm text-gray-900 dark:text-white">{selectedOrder.customer.phone}</p>
                    </div>
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mr-3 mt-1" />
                      <p className="text-sm text-gray-900 dark:text-white">{selectedOrder.customer.address}</p>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Информация о заказе</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Статус:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Оплата:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {getPaymentStatusText(selectedOrder.paymentStatus)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Способ оплаты:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedOrder.paymentMethod === 'card' ? 'Карта' : 'Наличные'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Дата создания:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Товары в заказе</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900 dark:text-white">{item.quantity} шт</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.price.toLocaleString()} ₽</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.total.toLocaleString()} ₽</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Итого</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Подытог:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedOrder.subtotal.toLocaleString()} ₽</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Скидка:</span>
                        <span className="text-sm text-green-600 dark:text-green-400">-{selectedOrder.discount.toLocaleString()} ₽</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Доставка:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedOrder.shipping.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Итого:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedOrder.total.toLocaleString()} ₽</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Примечания</h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-white">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    disabled={isLoading}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="new">Новый</option>
                    <option value="processing">В обработке</option>
                    <option value="shipped">Отправлен</option>
                    <option value="completed">Выполнен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    Печать
                  </button>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    Сохранить изменения
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 