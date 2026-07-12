import zhCN from './langs/zh-CN';
import enUS from './langs/en-US';
import koKR from './langs/ko-KR';

const locales: Record<App.I18n.LangType, App.I18n.Schema> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ko-KR': koKR
};

export default locales;
