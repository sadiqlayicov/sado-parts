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
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('sado-parts-token');
        const savedUser = localStorage.getItem('sado-parts-user');
        
        if (token && savedUser) {
          // Verify token is still valid by making a test request
          try {
            const response = await fetch('/api/users', {
              method: 'HEAD', // Just check if we can access protected route
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const userData = JSON.parse(savedUser);
              setUser(userData);
              setIsAuthenticated(true);
              setIsRegistered(userData.isRegistered);
              setIsApproved(userData.isApproved);
              setIsAdmin(userData.isAdmin);
            } else {
              // Token is invalid, clear stored data
              localStorage.removeItem('sado-parts-token');
              localStorage.removeItem('sado-parts-user');
            }
          } catch {
            // Network error or token invalid, clear stored data
            localStorage.removeItem('sado-parts-token');
            localStorage.removeItem('sado-parts-user');
          }
        }
      } catch (error) {
        // Handle error silently and clear any corrupted data
        localStorage.removeItem('sado-parts-token');
        localStorage.removeItem('sado-parts-user');
      }
    };
    
    initializeAuth();
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
    try {
      const response = await fetch('/api/auth/login', {
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
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.email,
          isRegistered: true,
          isApproved: data.user.isApproved,
          isAdmin: data.user.role === 'ADMIN',
          discountPercentage: 0 // This should come from user data if available
        };

        // Store the JWT token
        localStorage.setItem('sado-parts-token', data.token);
        
        setUser(userData);
        setIsAuthenticated(true);
        setIsRegistered(true);
        setIsApproved(userData.isApproved);
        setIsAdmin(userData.isAdmin);
        
        return true;
      } else {
        // Clear any existing auth data on failed login
        localStorage.removeItem('sado-parts-token');
        setUser(null);
        setIsAuthenticated(false);
        setIsRegistered(false);
        setIsApproved(false);
        setIsAdmin(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any existing auth data on error
      localStorage.removeItem('sado-parts-token');
      setUser(null);
      setIsAuthenticated(false);
      setIsRegistered(false);
      setIsApproved(false);
      setIsAdmin(false);
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
    // Clear JWT token from localStorage
    localStorage.removeItem('sado-parts-token');
    localStorage.removeItem('sado-parts-user');
    
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