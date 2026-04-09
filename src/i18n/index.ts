import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './ko.json';
import en from './en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    lng: localStorage.getItem('lang') ?? 'ko',
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false,
    },
  });

// 언어 변경 시 localStorage에 저장
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng);
});

export default i18n;
