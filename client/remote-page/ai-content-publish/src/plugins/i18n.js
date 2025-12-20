import { createI18n } from 'vue-i18n';
import messages from '@/i18n';

const LANGUAGE_STORAGE_KEYS = ['language', 'SOY_lang', 'lang'];

export const getStoredLocale = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  for (const key of LANGUAGE_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  return null;
};

export const persistLocalePreference = lang => {
  if (typeof window === 'undefined' || !window.localStorage || !lang) {
    return;
  }

  LANGUAGE_STORAGE_KEYS.forEach(key => {
    window.localStorage.setItem(key, lang);
  });
};

const getInitialLocale = () => getStoredLocale() || 'zh-CN';

const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'zh-CN',
  messages,
});

export default i18n;
