import { initGlobalState } from 'qiankun';
import { resolveInitialLocale } from '@/locales/locale-helpers';

export const initialLocale = resolveInitialLocale();

const actions = initGlobalState({ locale: initialLocale });

export function setMicroAppLocale(locale: string) {
  actions.setGlobalState({ locale });
}
