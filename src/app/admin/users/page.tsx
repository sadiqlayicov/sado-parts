'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { 
  FaUsers, 
  FaUserPlus, 
  FaUserEdit, 
  FaUserTimes, 
  FaCheck, 
  FaTimes,
  FaSearch,
  FaFilter,
  FaDownload,
  FaUpload,
  FaEye,
  FaBan,
  FaUnlock,
  FaCrown,
  FaUserShield,
  FaUserTie,
  FaUser
} from 'react-icons/fa';

export default function UsersManagement() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  useEffect(() => {
    const mockUsers = [
      {
        id: 1,
        name: 'Иван Петров',
        email: 'ivan@example.com',
        role: 'admin',
        status: 'approved',
        isApproved: true,
        discountPercentage: 15,
        registrationDate: '2024-01-15',
        lastLogin: '2024-07-20',
        ordersCount: 25,
        totalSpent: 125000,
        phone: '+7 (999) 123-45-67',
        address: 'г. Москва, ул. Примерная, д. 1'
      },
      {
        id: 2,
        name: 'Мария Сидорова',
        email: 'maria@example.com',
        role: 'customer',
        status: 'pending',
        isApproved: false,
        discountPercentage: 0,
        registrationDate: '2024-07-19',
        lastLogin: '2024-07-19',
        ordersCount: 0,
        totalSpent: 0,
        phone: '+7 (999) 234-56-78',
        address: 'г. Санкт-Петербург, ул. Тестовая, д. 2'
      },
      {
        id: 3,
        name: 'Алексей Козлов',
        email: 'alex@example.com',
        role: 'moderator',
        status: 'approved',
        isApproved: true,
        discountPercentage: 10,
        registrationDate: '2024-03-10',
        lastLogin: '2024-07-20',
        ordersCount: 12,
        totalSpent: 45000,
        phone: '+7 (999) 345-67-89',
        address: 'г. Екатеринбург, ул. Новая, д. 3'
      },
      {
        id: 4,
        name: 'Елена Воробьева',
        email: 'elena@example.com',
        role: 'customer',
        status: 'blocked',
        isApproved: true,
        discountPercentage: 5,
        registrationDate: '2024-02-20',
        lastLogin: '2024-07-15',
        ordersCount: 8,
        totalSpent: 32000,
        phone: '+7 (999) 456-78-90',
        address: 'г. Новосибирск, ул. Центральная, д. 4'
      },
      {
        id: 5,
        name: 'Дмитрий Соколов',
        email: 'dmitry@example.com',
        role: 'operator',
        status: 'approved',
        isApproved: true,
        discountPercentage: 0,
        registrationDate: '2024-05-05',
        lastLogin: '2024-07-20',
        ordersCount: 0,
        totalSpent: 0,
        phone: '+7 (999) 567-89-01',
        address: 'г. Казань, ул. Рабочая, д. 5'
      }
    ];
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <FaCrown className="text-yellow-500" />;
      case 'moderator': return <FaUserShield className="text-blue-500" />;
      case 'operator': return <FaUserTie className="text-green-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'moderator': return 'Модератор';
      case 'operator': return 'Оператор';
      case 'customer': return 'Клиент';
      default: return 'Неизвестно';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Одобрен';
      case 'pending': return 'Ожидает';
      case 'blocked': return 'Заблокирован';
      default: return 'Неизвестно';
    }
  };

  const handleApproveUser = async (userId: number) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: 'approved', isApproved: true }
        : user
    ));
    setIsLoading(false);
  };

  const handleBlockUser = async (userId: number) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: 'blocked' }
        : user
    ));
    setIsLoading(false);
  };

  const handleUnblockUser = async (userId: number) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: 'approved' }
        : user
    ));
    setIsLoading(false);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Управление пользователями</h1>
          <p className="text-gray-600 dark:text-gray-400">Управление пользователями и их правами</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center">
            <FaUserPlus className="mr-2" />
            Добавить пользователя
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center">
            <FaDownload className="mr-2" />
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
                placeholder="Имя или email..."
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
              <option value="approved">Одобренные</option>
              <option value="pending">Ожидающие</option>
              <option value="blocked">Заблокированные</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Роль
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все роли</option>
              <option value="admin">Администраторы</option>
              <option value="moderator">Модераторы</option>
              <option value="operator">Операторы</option>
              <option value="customer">Клиенты</option>
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

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Пользователи ({filteredUsers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Скидка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Заказы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Последний вход
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {getRoleText(user.role)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.discountPercentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.ordersCount} ({user.totalSpent.toLocaleString()} ₽)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      {user.status === 'pending' && (
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        >
                          <FaCheck className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === 'approved' && (
                        <button
                          onClick={() => handleBlockUser(user.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          <FaBan className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === 'blocked' && (
                        <button
                          onClick={() => handleUnblockUser(user.id)}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        >
                          <FaUnlock className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Детали пользователя
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Основная информация</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Имя</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Телефон</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Адрес</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.address}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Статистика</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Роль</label>
                      <p className="text-sm text-gray-900 dark:text-white">{getRoleText(selectedUser.role)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Статус</label>
                      <p className="text-sm text-gray-900 dark:text-white">{getStatusText(selectedUser.status)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Скидка</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.discountPercentage}%</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Заказов</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.ordersCount}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Общая сумма</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.totalSpent.toLocaleString()} ₽</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Дата регистрации</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedUser.registrationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Последний вход</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedUser.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Закрыть
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 