import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import az from '../locales/az/common.json';
import ru from '../locales/ru/common.json';
import en from '../locales/en/common.json';
import zh from '../locales/zh/common.json';
import de from '../locales/de/common.json';

const isServer = typeof window === 'undefined';

const i18nInstance = isServer
  ? i18n.use(initReactI18next)
  : i18n.use(LanguageDetector).use(initReactI18next);

i18nInstance.init({
  resources: {
    az: { translation: az },
    ru: { translation: ru },
    en: { translation: en },
    zh: { translation: zh },
    de: { translation: de },
  },
  lng: 'ru', // SSR üçün həmişə rusca
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },
});

export default i18n; 