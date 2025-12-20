import { localStg } from '@/utils/storage';

const COMPAT_LANGUAGE_KEYS = ['language', 'SOY_lang', 'lang'];

export function resolveInitialLocale() {
  const storedByApp = localStg.get('lang');
  if (storedByApp) {
    return storedByApp;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    for (const key of COMPAT_LANGUAGE_KEYS) {
      const value:any = window.localStorage.getItem(key);
      if (value) {
        localStg.set('lang', value);
        return value;
      }
    }
  }

  return 'zh-CN';
}
