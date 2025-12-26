'use strict';

/**
 * localeDetector 中间件
 * - 统一解析 query / cookie / Accept-Language / 用户 session 的语言偏好
 * - 调用 ctx.setLocale 并同步 ctx.session.locale，方便模板与 helper 读取
 * @param options
 * @param app
 */
module.exports = (options, app) => {
  const defaultLocale = app.config.i18n?.defaultLocale || 'zh-CN';
  const supportedLocales = options?.supportedLocales || app.config.i18n?.supportedLocales || ['zh-CN', 'en-US'];
  const cookieField = options?.cookieField || app.config.i18n?.cookieField || 'locale';

  /**
   * 使用 ctx.acceptsLanguages() 结果提取语言
   * @param {Array|String} accepts
   * @return {String|undefined}
   */
  function detectFromAcceptsList(accepts) {
    if (!accepts) return undefined;
    const list = Array.isArray(accepts) ? accepts : [accepts];
    for (const lang of list) {
      if (!lang) continue;
      const normalized = normalizeLocale(lang);
      if (supportedLocales.includes(normalized)) {
        return normalized;
      }
    }
    return undefined;
  }

  /**
   * 从 Accept-Language 头中提取语言（兼容旧逻辑）
   * @param {String} header
   * @return {String|undefined}
   */
  function detectFromHeader(header = '') {
    if (!header) return undefined;
    return header
      .split(',')
      .map(part => part.split(';')[0]?.trim())
      .map(lang => normalizeLocale(lang))
      .find(lang => supportedLocales.includes(lang));
  }

  /**
   * 规范化 locale，如果不支持则回退默认值
   * @param {String} locale
   * @return {String}
   */
  function normalizeLocale(locale) {
    if (!locale) return defaultLocale;
    const matched = supportedLocales.find(item => item.toLowerCase() === locale.toLowerCase());
    return matched || defaultLocale;
  }

  return async function localeDetector(ctx, next) {
    const queryLocale = ctx.query?.locale;
    const cookieLocale = ctx.cookies.get(cookieField, { signed: false });
    const sessionLocale = ctx.session?.locale;
    const acceptsLocale = detectFromAcceptsList(ctx.acceptsLanguages && ctx.acceptsLanguages());
    const headerLocale = detectFromHeader(ctx.get('Accept-Language'));

    const locale = normalizeLocale(queryLocale || cookieLocale || sessionLocale || acceptsLocale || headerLocale);
    const localeForContext = locale ? locale.replace('_', '-').toLowerCase() : locale;

    if (typeof ctx.__setLocale === 'function') {
      ctx.__setLocale(localeForContext);
    } else {
      ctx.locale = localeForContext;
    }
    ctx.session.locale = localeForContext;
    ctx.cookies.set(cookieField, localeForContext, {
      httpOnly: false,
      sameSite: 'lax',
    });

    await next();
  };
};
