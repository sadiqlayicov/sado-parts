'use client';

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const { cartItemsCount } = useCart();
  const { user, isAuthenticated, isRegistered, isApproved, isAdmin, login, register, logout, getDiscountPercentage } = useAuth();
  
  const [showCategories, setShowCategories] = useState(false);
  const [showBrands, setShowBrands] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { name: "Двигатели", href: "/catalog?category=engine" },
    { name: "Гидравлика", href: "/catalog?category=hydraulic" },
    { name: "Трансмиссия", href: "/catalog?category=transmission" },
    { name: "Тормозная система", href: "/catalog?category=brakes" },
    { name: "Электрика", href: "/catalog?category=electrical" },
    { name: "Рулевое управление", href: "/catalog?category=steering" }
  ];

  const brands = [
    "Toyota", "Komatsu", "Nissan", "Mitsubishi", "Garrett", "Kawasaki", 
    "Hydraulic", "Transmission", "Brake", "Electrical", "Steering"
  ];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let success = false;
      if (isLogin) {
        success = await login(formData.email, formData.password);
      } else {
        success = await register(formData.email, formData.password, formData.name);
      }
      
      if (success) {
        setShowAuth(false);
        setFormData({ email: '', password: '', name: '' });
      } else {
        alert('Ошибка авторизации. Проверьте данные.');
      }
    } catch (error) {
      alert('Произошла ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24">
          {/* Логотип */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold neon-text">Sado-Parts</h1>
              <p className="text-xs text-cyan-300">Запчасти для погрузчиков</p>
            </div>
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-cyan-300 transition font-semibold">Главная</Link>
            
            {/* Категории */}
            <div 
              className="relative"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <button className="hover:text-cyan-300 transition font-semibold flex items-center gap-1">
                Каталог
                <span className="text-xs">▼</span>
              </button>
              {showCategories && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e293b] rounded-xl shadow-2xl border border-cyan-500/20 py-2 z-50">
                  {categories.map(category => (
                    <Link
                      key={category.name}
                      href={category.href}
                      className="block px-4 py-2 text-sm text-white hover:bg-cyan-600 rounded transition"
                      onClick={() => setShowCategories(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Бренды */}
            <div 
              className="relative"
              onMouseEnter={() => setShowBrands(true)}
              onMouseLeave={() => setShowBrands(false)}
            >
              <button className="hover:text-cyan-300 transition font-semibold flex items-center gap-1">
                Бренды
                <span className="text-xs">▼</span>
              </button>
              {showBrands && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e293b] rounded-xl shadow-2xl border border-cyan-500/20 py-2 max-h-96 overflow-y-auto z-50">
                  {brands.map(brand => (
                    <Link
                      key={brand}
                      href={{ pathname: '/catalog', query: { brand: brand } }}
                      className="block px-4 py-2 text-sm text-white hover:bg-cyan-600 rounded transition"
                      onClick={() => setShowBrands(false)}
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/blog" className="hover:text-cyan-300 transition font-semibold">Блог</Link>
            <Link href="/contacts" className="hover:text-cyan-300 transition font-semibold">Контакты</Link>
            
            {/* Admin Panel Link */}
            {isAdmin && (
              <Link href="/admin" className="hover:text-cyan-300 transition font-semibold text-yellow-400">
                Админ панель
              </Link>
            )}
          </nav>

          {/* Правые элементы */}
          <div className="flex items-center gap-4">
            {/* Пользователь */}
            <div className="relative">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    {isAdmin && (
                      <p className="text-xs text-yellow-400">Администратор</p>
                    )}
                    {isApproved && !isAdmin && (
                      <p className="text-xs text-green-400">Скидка {getDiscountPercentage()}%</p>
                    )}
                    {!isApproved && !isAdmin && (
                      <p className="text-xs text-yellow-400">Ожидает одобрения</p>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold text-sm transition"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold transition"
                >
                  Войти
                </button>
              )}
            </div>

            {/* Корзина */}
            <Link href="/cart" className="relative">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center hover:bg-cyan-600 transition">
                <span className="text-lg">🛒</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Модальное окно авторизации */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {isLogin ? 'Вход' : 'Регистрация'}
              </h2>
              <button
                onClick={() => setShowAuth(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Имя"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-[#0f172a] text-white border border-cyan-500/20 focus:border-cyan-500 outline-none"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 rounded-lg text-white font-semibold transition"
              >
                {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-400 hover:text-cyan-300 text-sm"
              >
                {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
              </button>
            </div>

            {!isLogin && (
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm text-center">
                  ⏳ После регистрации ваш аккаунт будет рассмотрен администратором для получения скидки!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 