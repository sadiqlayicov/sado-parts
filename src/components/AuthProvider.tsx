'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  isRegistered: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  discountPercentage: number;
  approvedBy?: string;
  approvedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isRegistered: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  calculateDiscountedPrice: (originalPrice: number) => number;
  getDiscountPercentage: () => number;
  refreshUserStatus: () => Promise<void>;
  clearCachedData: () => void;
  // Admin functions
  approveUser: (userId: string) => Promise<boolean>;
  setUserDiscount: (userId: string, discountPercentage: number) => Promise<boolean>;
  getAllUsers: () => User[];
  getPendingUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data (in real app this would be in database)
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@sado-parts.ru',
    name: 'Administrator',
    isRegistered: true,
    isApproved: true,
    isAdmin: true,
    discountPercentage: 0
  },
  {
    id: '2',
    email: 'user1@example.com',
    name: 'Иван Петров',
    isRegistered: true,
    isApproved: true,
    isAdmin: false,
    discountPercentage: 10,
    approvedBy: 'admin@sado-parts.ru',
    approvedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '3',
    email: 'user2@example.com',
    name: 'Мария Сидорова',
    isRegistered: true,
    isApproved: false,
    isAdmin: false,
    discountPercentage: 0
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>(mockUsers);

  // Загрузка пользователя из localStorage при инициализации
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sado-parts-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        setIsRegistered(userData.isRegistered);
        setIsApproved(userData.isApproved);
        setIsAdmin(userData.isAdmin);
      }
    } catch (error) {
      // Handle error silently
    }
  }, []);

  // Сохранение пользователя в localStorage при изменениях
  useEffect(() => {
    if (user) {
      localStorage.setItem('sado-parts-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sado-parts-user');
    }
  }, [user]);

  // Real API functions
  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('API response for user refresh:', data);
        
        // Extract user data from the response
        const userData = data.user || data;
        const updatedUser = {
          ...user,
          isApproved: userData.isApproved,
          discountPercentage: userData.discountPercentage || 0
        };
        
        // Check if approval status changed
        const wasApproved = user.isApproved;
        const isNowApproved = userData.isApproved;
        
        console.log('Approval status check:', { wasApproved, isNowApproved, userData });
        
        setUser(updatedUser);
        setIsApproved(userData.isApproved);
        localStorage.setItem('sado-parts-user', JSON.stringify(updatedUser));
        console.log('User data refreshed:', updatedUser);
        
        // Show notification if approval status changed
        if (!wasApproved && isNowApproved) {
          alert('🎉 Поздравляем! Ваш аккаунт был одобрен администратором!');
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Manual refresh function that can be called from components
  const refreshUserStatus = async () => {
    await refreshUserData();
  };

  // Clear cached data and force fresh login
  const clearCachedData = () => {
    localStorage.removeItem('sado-parts-user');
    setUser(null);
    setIsAuthenticated(false);
    setIsRegistered(false);
    setIsApproved(false);
    setIsAdmin(false);
  };

  // Check user approval status periodically
  useEffect(() => {
    if (user && !user.isAdmin) {
      // Check more frequently if user is not approved yet
      const interval = setInterval(refreshUserData, user.isApproved ? 30000 : 5000); // 5 seconds if not approved, 30 seconds if approved
      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || 'User',
          isRegistered: true,
          isApproved: data.user.isApproved,
          isAdmin: data.user.role === 'ADMIN',
          discountPercentage: data.user.discountPercentage || 0
        };

        setUser(userData);
        setIsAuthenticated(true);
        setIsRegistered(true);
        setIsApproved(data.user.isApproved);
        setIsAdmin(data.user.role === 'ADMIN');
        localStorage.setItem('sado-parts-user', JSON.stringify(userData));
        return true;
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    // Имитация API запроса регистрации
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email && password && name) {
          // Проверяем, не существует ли уже пользователь
          const existingUser = users.find(u => u.email === email);
          
          if (existingUser) {
            resolve(false); // Пользователь уже существует
            return;
          }
          
          const newUser: User = {
            id: Date.now().toString(),
            email,
            name,
            isRegistered: true,
            isApproved: false, // Требует одобрения администратора
            isAdmin: false,
            discountPercentage: 0
          };
          
          setUsers(prev => [...prev, newUser]);
          setUser(newUser);
          setIsAuthenticated(true);
          setIsRegistered(true);
          setIsApproved(false);
          setIsAdmin(false);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsRegistered(false);
    setIsApproved(false);
    setIsAdmin(false);
    localStorage.removeItem('sado-parts-user');
  };

  // Расчет цены со скидкой для одобренных пользователей
  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (isApproved && isAuthenticated && user && user.discountPercentage > 0) {
      const discountedPrice = originalPrice * (1 - user.discountPercentage / 100);
      return Math.floor(discountedPrice * 100) / 100; // Сохраняем 2 знака после запятой
    }
    return originalPrice;
  };

  // Получение процента скидки
  const getDiscountPercentage = (): number => {
    return (isApproved && isAuthenticated && user && user.discountPercentage) || 0;
  };

  // Admin functions
  const approveUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isApproved: true })
      });

      if (response.ok) {
        // If the approved user is the current user, refresh their data immediately
        if (user && user.id === userId) {
          await refreshUserData();
        }
        return true;
      } else {
        console.error('Failed to approve user');
        return false;
      }
    } catch (error) {
      console.error('Error approving user:', error);
      return false;
    }
  };

  const setUserDiscount = async (userId: string, discountPercentage: number): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, discountPercentage }
            : u
        ));
        resolve(true);
      }, 500);
    });
  };

  const getAllUsers = (): User[] => {
    return users.filter(u => !u.isAdmin); // Не показываем админов в списке
  };

  const getPendingUsers = (): User[] => {
    return users.filter(u => !u.isAdmin && !u.isApproved);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isRegistered,
      isApproved,
      isAdmin,
      login,
      register,
      logout,
      calculateDiscountedPrice,
      getDiscountPercentage,
      refreshUserStatus,
      clearCachedData,
      approveUser,
      setUserDiscount,
      getAllUsers,
      getPendingUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 