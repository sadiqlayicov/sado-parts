export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Страница не найдена
          </h2>
          <p className="text-gray-600 mb-8">
            Извините, запрашиваемая страница не существует или была перемещена.
          </p>
        </div>
        
        <div className="space-y-4">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
          >
            Вернуться на главную
          </a>
          
          <div className="text-sm text-gray-500">
            <a href="/catalog" className="text-blue-600 hover:text-blue-800">
              Перейти в каталог
            </a>
            {' • '}
            <a href="/contacts" className="text-blue-600 hover:text-blue-800">
              Связаться с нами
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
