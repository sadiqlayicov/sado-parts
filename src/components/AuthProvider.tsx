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

  const login = async (email: string, password: string): Promise<boolean> => {
    // Имитация API запроса
    return new Promise((resolve) => {
      setTimeout(() => {
        // Простая проверка для демонстрации
        if (email && password) {
          // Проверяем существующих пользователей
          const existingUser = users.find(u => u.email === email);
          
          if (existingUser) {
            setUser(existingUser);
            setIsAuthenticated(true);
            setIsRegistered(existingUser.isRegistered);
            setIsApproved(existingUser.isApproved);
            setIsAdmin(existingUser.isAdmin);
            resolve(true);
          } else {
            // Создаем нового пользователя (не одобренного)
            const newUser: User = {
              id: Date.now().toString(),
              email,
              name: email.split('@')[0],
              isRegistered: true,
              isApproved: false,
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
          }
        } else {
          resolve(false);
        }
      }, 1000);
    });
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
  };

  // Расчет цены со скидкой для одобренных пользователей
  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (isApproved && isAuthenticated && user && user.discountPercentage > 0) {
      return Math.round(originalPrice * (1 - user.discountPercentage / 100));
    }
    return originalPrice;
  };

  // Получение процента скидки
  const getDiscountPercentage = (): number => {
    return (isApproved && isAuthenticated && user && user.discountPercentage) || 0;
  };

  // Admin functions
  const approveUser = async (userId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                isApproved: true, 
                approvedBy: user?.email || 'admin',
                approvedAt: new Date().toISOString()
              }
            : u
        ));
        resolve(true);
      }, 500);
    });
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