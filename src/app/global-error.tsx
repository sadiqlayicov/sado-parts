'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <head>
        <title>Ошибка | Sado-Parts</title>
        <meta name="description" content="Произошла ошибка" />
      </head>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-red-600 mb-4">Ошибка</h1>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Что-то пошло не так
              </h2>
              <p className="text-gray-600 mb-8">
                Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={reset}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Попробовать снова
              </button>
              
              <div className="text-sm text-gray-500">
                <a href="/" className="text-blue-600 hover:text-blue-800">
                  Вернуться на главную
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
