'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Имитация регистрации
    setTimeout(() => {
      setIsLoading(false);
      console.log('Регистрация:', formData);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white flex items-center justify-center p-8">
      <div className="bg-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center neon-text">Регистрация</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Имя
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg text-black outline-none focus:ring-2 focus:ring-cyan-400 transition"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg text-black outline-none focus:ring-2 focus:ring-cyan-400 transition"
              required
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Телефон
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg text-black outline-none focus:ring-2 focus:ring-cyan-400 transition"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Подтвердите пароль
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg text-black outline-none focus:ring-2 focus:ring-cyan-400 transition"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-semibold text-lg transition disabled:opacity-50"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
} 