import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import { CartProvider } from "../components/CartProvider";
import { AuthProvider } from "../components/AuthProvider";
import Header from "../components/Header";
import LanguageSwitcher from '../components/LanguageSwitcher';
import PerformanceMonitor from '../components/PerformanceMonitor';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sado-Parts — Запчасти для вилочных погрузчиков в Москве | Интернет-магазин премиум-класса",
  description: "Премиум интернет-магазин Sado-Parts: оригинальные и аналоговые запчасти для вилочных погрузчиков. Быстрая доставка по Москве и России. Гарантия качества, поддержка 24/7, AR/VR-каталог, лучшие цены.",
  keywords: "запчасти для погрузчиков, купить запчасти, вилочные погрузчики, Москва, Sado-Parts, AR каталог, VR просмотр, оригинальные детали, складская техника, сервис, доставка, интернет-магазин",
  openGraph: {
    title: "Sado-Parts — Запчасти для вилочных погрузчиков в Москве",
    description: "Премиум интернет-магазин Sado-Parts: оригинальные и аналоговые запчасти для вилочных погрузчиков. Быстрая доставка по Москве и России.",
    url: "https://sado-parts.ru/",
    siteName: "Sado-Parts",
    locale: "ru_RU",
    type: "website",
  },
  alternates: {
    canonical: "https://sado-parts.ru/",
    languages: {
      ru: "https://sado-parts.ru/",
      en: "https://sado-parts.ru/en/",
      zh: "https://sado-parts.ru/zh/",
      tr: "https://sado-parts.ru/tr/",
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="yandex-verification" content="" />
        <meta name="google-site-verification" content="" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageSwitcher />
        <AuthProvider>
          <CartProvider>
            <Header />
            <div className="pt-24">{children}</div>
            <PerformanceMonitor />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
