'use client';

import { useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        router.push('/admin');
      } else {
        setError('Yanlış email və ya şifrə');
      }
    } catch (error) {
      setError('Giriş zamanı xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white flex items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 neon-text">Вход в аккаунт</h2>
          <p className="text-gray-300">Hesabınıza daxil olun</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
              placeholder="Şifrənizi daxil edin"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 font-semibold text-lg transition duration-200 shadow-md hover:transform hover:-translate-y-1px disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Вход...
                </div>
              ) : (
                'Вход'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Нет аккаунта?{' '}
            <a href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Зарегистрироваться
            </a>
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300 text-center">
            Демо данные: admin@sado-parts.ru / admin123
          </p>
        </div>
      </div>

      <style jsx>{`
        .neon-text {
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3);
        }
      `}</style>
    </main>
  );
} 