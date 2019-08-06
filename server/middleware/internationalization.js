/*
 * @Author: doramart 
 * @Date: 2019-07-16 14:20:06 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-29 14:35:59
 */
const settings = require('@configs/settings');
const i18n = require('i18n');
const url = require('url');

module.exports = (req, res, next) => {

    let targetLanguage = url.parse(req.originalUrl).pathname;
    let reqParams = req.query;
    // 针对移动端
    if (reqParams.token && reqParams.lang) {
        let currentLang = reqParams.lang;
        if ((settings.languages).indexOf(currentLang) < 0) {
            currentLang = 'zh-CN';
        }
        i18n.setLocale(req, currentLang);
        next();
    } else { // web端
        if (targetLanguage) {
            let languageStr = targetLanguage.split('/')[1];
            // 访问首页
            if (languageStr == '') {
                // 自己以前切换过
                if (req.session.locale) {
                    res.redirect('/' + req.session.locale);
                } else { // 第一次访问
                    // 获取浏览器语言
                    let browserLanguage = req.headers["accept-language"];
                    if (browserLanguage) {
                        let currentLanguage = browserLanguage.split(',')[0];
                        if (currentLanguage.indexOf(settings.languages) >= 0) {
                            req.session.locale = currentLanguage;
                            res.redirect('/' + currentLanguage);
                        } else {
                            req.session.locale = 'zh-CN';
                        }
                    } else {
                        req.session.locale = 'zh-CN';
                    }
                    i18n.setLocale(req, req.session.locale);
                    next();
                }
            } else { // 从别的页面进来的
                if (languageStr == 'zh-CN') {
                    req.session.locale = 'zh-CN';
                } else if (languageStr == 'zh-TW') {
                    req.session.locale = 'zh-TW';
                } else if (languageStr == 'en') {
                    req.session.locale = 'en';
                } else {
                    if (!req.session.locale) {
                        let browserLanguage = req.headers["accept-language"];
                        if (browserLanguage) {
                            let currentLanguage = browserLanguage.split(',')[0];
                            if (currentLanguage.indexOf(settings.languages) >= 0) {
                                req.session.locale = currentLanguage;
                            } else {
                                req.session.locale = 'zh-CN';
                            }
                        } else {
                            req.session.locale = 'zh-CN';
                        }
                    }
                }
                if (req.session.locale) {
                    i18n.setLocale(req, req.session.locale);
                }
                next();
            }

        } else {
            next();
        }
    }
}