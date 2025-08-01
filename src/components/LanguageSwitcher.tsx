'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import i18n from '../lib/i18n';

const languages = [
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'de', label: 'DE' },
];

export default function LanguageSwitcher() {
  const { i18n: i18nHook } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    window.location.reload(); // Yalnız reload, router.push olmadan!
  };

  return (
    <select
      value={i18nHook.language}
      onChange={handleChange}
      style={{
        background: '#222',
        color: '#fff',
        border: '1px solid #444',
        borderRadius: 6,
        padding: '4px 12px',
        minWidth: 60,
        fontWeight: 'bold',
        cursor: 'pointer',
      }}
    >
      {languages.map((lang) => (
        <option
          key={lang.code}
          value={lang.code}
          style={{ background: '#222', color: '#fff' }}
        >
          {lang.label}
        </option>
      ))}
    </select>
  );
} 