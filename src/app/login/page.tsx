'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@sado-parts.ru');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Redirect based on user role
        router.push('/admin');
      } else {
        setError('Неверный email или пароль');
      }
    } catch (error) {
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white flex items-center justify-center p-8">
      <div className="bg-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center neon-text">Вход в аккаунт</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-black outline-none focus:ring-2 focus:ring-cyan-400 transition"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-black outline-none focus:ring-2 focus:ring-cyan-400 transition"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition disabled:opacity-50"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300">
              Зарегистрироваться
            </Link>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Демо данные: admin@sado-parts.ru / admin123
          </p>
        </div>
      </div>
    </main>
  );
} 