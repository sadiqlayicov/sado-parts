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
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Countries and cities data
  const countries = [
    { name: 'Azerbaijan', cities: ['Baku', 'Ganja', 'Sumgayit', 'Mingachevir', 'Lankaran', 'Shaki', 'Yevlakh', 'Nakhchivan'] },
    { name: 'Russia', cities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod'] },
    { name: 'Turkey', cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana'] },
    { name: 'Georgia', cities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Gori'] },
    { name: 'Ukraine', cities: ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk', 'Lviv'] },
    { name: 'Kazakhstan', cities: ['Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Karaganda'] },
    { name: 'Uzbekistan', cities: ['Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan'] },
    { name: 'Kyrgyzstan', cities: ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol'] },
    { name: 'Tajikistan', cities: ['Dushanbe', 'Khujand', 'Kulob', 'Qurghonteppa'] },
    { name: 'Turkmenistan', cities: ['Ashgabat', 'Türkmenabat', 'Dasoguz', 'Mary'] }
  ];

  const getCitiesForCountry = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    return country ? country.cities : [];
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('isApproved', statusFilter === 'approved' ? 'true' : 'false');
      if (roleFilter !== 'all') params.append('role', roleFilter.toUpperCase());
      if (countryFilter) params.append('country', countryFilter);
      if (cityFilter) params.append('city', cityFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data && data.users && Array.isArray(data.users)) {
        const processedUsers = data.users.map((user: any) => ({
          ...user,
          name: user.name || 'İstifadəçi',
          firstName: user.firstName || user.name?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          role: user.role?.toLowerCase() || (user.isAdmin ? 'admin' : 'customer'),
          discountPercentage: user.discountPercentage || 0,
          ordersCount: 0,
          totalSpent: 0,
          lastLogin: user.updatedAt || user.createdAt,
          registrationDate: user.createdAt,
          phone: user.phone || '—',
          country: user.country || '—',
          city: user.city || '—',
          inn: user.inn || '—',
          address: user.address || '—'
        }));
        setUsers(processedUsers);
        setFilteredUsers(processedUsers);
      } else {
        console.error('Invalid data format received:', data);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  // Fetch users with filters
  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter, roleFilter, countryFilter, cityFilter]);

  // Auto-refresh users list every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // No need for client-side filtering since we're filtering on the server

  const getRoleIcon = (role: string) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case 'admin': return <FaCrown className="text-yellow-500" />;
      case 'moderator': return <FaUserShield className="text-blue-500" />;
      case 'operator': return <FaUserTie className="text-green-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getRoleText = (role: string) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
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
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Təsdiqlənmiş';
      case 'pending': return 'Gözləyir';
      case 'blocked': return 'Bloklanmış';
      case 'inactive': return 'Deaktiv';
      default: return 'Naməlum';
    }
  };

  const getUserStatus = (user: any) => {
    if (!user.isActive) return 'blocked';
    if (user.isApproved) return 'approved';
    return 'pending';
  };

  const handleApproveUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isApproved: true, isActive: true }
            : user
        ));
        alert(data.message || 'İstifadəçi uğurla təsdiqləndi!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'İstifadəçi təsdiqləmə zamanı xəta baş verdi');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('İstifadəçi təsdiqləmə zamanı xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'block'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isApproved: false, isActive: false }
            : user
        ));
        alert(data.message || 'İstifadəçi uğurla bloklandı!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'İstifadəçi bloklama zamanı xəta baş verdi');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('İstifadəçi bloklama zamanı xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unblock'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isApproved: true, isActive: true }
            : user
        ));
        alert(data.message || 'İstifadəçi blokdan uğurla çıxarıldı!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'İstifadəçi blokdan çıxarma zamanı xəta baş verdi');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('İstifadəçi blokdan çıxarma zamanı xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (user: any) => {
    try {
      // Use the user data we already have instead of making another API call
      setSelectedUser({
        ...user,
        // Ensure all required fields are present
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        city: user.city || '',
        inn: user.inn || '',
        address: user.address || '',
        role: user.role || 'CUSTOMER',
        isApproved: user.isApproved || false,
        discountPercentage: user.discountPercentage || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error setting user data:', error);
      alert('İstifadəçi məlumatlarını əldə etmə zamanı xəta baş verdi');
    }
  };

  const handleSaveUser = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setUsers(users.map(user => 
          user.id === userData.id 
            ? { ...user, ...userData }
            : user
        ));
        alert('İstifadəçi məlumatları uğurla yeniləndi!');
        setIsEditModalOpen(false);
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'İstifadəçi məlumatlarını yeniləmə zamanı xəta baş verdi');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('İstifadəçi məlumatlarını yeniləmə zamanı xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUserModal = async (user: any) => {
    try {
      // Use the user data we already have instead of making another API call
      const userData = {
        ...user,
        status: user.isApproved ? 'approved' : 'pending',
        registrationDate: user.createdAt,
        lastLogin: user.updatedAt,
        // Ensure all required fields are present
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        city: user.city || '',
        inn: user.inn || '',
        address: user.address || '',
        role: user.role || 'CUSTOMER',
        isApproved: user.isApproved || false,
        discountPercentage: user.discountPercentage || 0
      };
      setEditingUser(userData);
    } catch (error) {
      console.error('Error setting user data:', error);
      setEditingUser({ ...user });
    }
    setIsEditModalOpen(true);
    setIsModalOpen(false);
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <option value="all">Bütün statuslar</option>
              <option value="approved">Təsdiqlənmiş</option>
              <option value="pending">Gözləyən</option>
              <option value="blocked">Bloklanmış</option>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Страна
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все страны</option>
              {countries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Город
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              disabled={!countryFilter}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Все города</option>
              {countryFilter && getCitiesForCountry(countryFilter).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
                setCountryFilter('');
                setCityFilter('');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center"
            >
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
            Пользователи ({Array.isArray(filteredUsers) ? filteredUsers.length : 0})
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
                  ИНН
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Контакты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Страна
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Город
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Скидка %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(Array.isArray(filteredUsers) ? filteredUsers : []).map((user) => {
                // Adı düzgün göstərmək üçün təhlükəsiz funksiya
                const getDisplayName = (user: any) => {
                  if (user.name && typeof user.name === 'string' && user.name.length > 0 && user.name !== 'İstifadəçi') return user.name;
                  if (user.firstName || user.lastName) {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    if (fullName.length > 0) return fullName;
                  }
                  return 'İstifadəçi';
                };
                const displayName = getDisplayName(user);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {displayName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {displayName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.inn || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div>{user.phone || '—'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {user.country || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {user.city || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.discountPercentage > 0 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {user.discountPercentage || 0}%
                        </span>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getUserStatus(user))}`}>
                        {getStatusText(getUserStatus(user))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                        {getUserStatus(user) === 'pending' && (
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                            title="Təsdiqlə"
                          >
                            <FaCheck className="h-4 w-4" />
                          </button>
                        )}
                        {getUserStatus(user) === 'approved' && (
                          <button
                            onClick={() => handleBlockUser(user.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            title="Blokla"
                          >
                            <FaBan className="h-4 w-4" />
                          </button>
                        )}
                        {getUserStatus(user) === 'blocked' && (
                          <button
                            onClick={() => handleUnblockUser(user.id)}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                            title="Blokdan çıxar"
                          >
                            <FaUnlock className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Телефон</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.phone || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Страна</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.country || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Город</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.city || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">ИНН</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.inn || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Адрес</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.address || '—'}</p>
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
                      <p className="text-sm text-gray-900 dark:text-white">{getStatusText(selectedUser.isApproved ? 'approved' : 'pending')}</p>
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
                      <p className="text-sm text-gray-900 dark:text-white">{(selectedUser.totalSpent || 0).toLocaleString()} ₽</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Дата регистрации</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('ru-RU') : '—'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Последний вход</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('ru-RU') : '—'}
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
                <button 
                  onClick={() => handleEditUserModal(selectedUser)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                İstifadəçi məlumatlarını redaktə et
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ad
                </label>
                <input
                  type="text"
                  value={editingUser.firstName || ''}
                  onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Soyad
                </label>
                <input
                  type="text"
                  value={editingUser.lastName || ''}
                  onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefon
                </label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ölkə
                </label>
                <select
                  value={editingUser.country || ''}
                  onChange={(e) => {
                    const selectedCountry = e.target.value;
                    setEditingUser({
                      ...editingUser, 
                      country: selectedCountry,
                      city: '' // Reset city when country changes
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Ölkə seçin</option>
                  {countries.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Şəhər
                </label>
                <select
                  value={editingUser.city || ''}
                  onChange={(e) => setEditingUser({...editingUser, city: e.target.value})}
                  disabled={!editingUser.country}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Şəhər seçin</option>
                  {editingUser.country && getCitiesForCountry(editingUser.country).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  VÖEN (İNN)
                </label>
                <input
                  type="text"
                  value={editingUser.inn || ''}
                  onChange={(e) => setEditingUser({...editingUser, inn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ünvan
                </label>
                <textarea
                  value={editingUser.address || ''}
                  onChange={(e) => setEditingUser({...editingUser, address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  value={editingUser.role || 'CUSTOMER'}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CUSTOMER">Müştəri</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="OPERATOR">Operator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={editingUser.isApproved ? 'approved' : 'pending'}
                  onChange={(e) => setEditingUser({...editingUser, isApproved: e.target.value === 'approved'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="approved">Təsdiqlənmiş</option>
                  <option value="pending">Gözləyir</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endirim faizi (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingUser.discountPercentage || 0}
                  onChange={(e) => setEditingUser({...editingUser, discountPercentage: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Müştərinin məhsullardan alacağı endirim faizi (0-100%)
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 flex-shrink-0">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Ləğv et
              </button>
              <button
                onClick={() => handleSaveUser(editingUser)}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {isLoading ? 'Yenilənir...' : 'Yadda saxla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 