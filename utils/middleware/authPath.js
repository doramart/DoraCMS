/**
 * 过滤url中的非法请求
 */
import url from 'url';
import filters from '../filters'

module.exports = (req, res, next) => {

    let oldParams = url.parse(req.url).search;
    let basePath = process.env.NODE_ENV == 'development' ? '' : '/oas/static';
    if (/[- <>.!@#$%^*()+/*]/.test(oldParams)) {
        console.log('包含特殊字符，不允许访问!');
        let newParams = filters.validateWords(oldParams);
        res.redirect(basePath + url.parse(req.url).pathname + newParams);
    } else {
        next();
    }

}