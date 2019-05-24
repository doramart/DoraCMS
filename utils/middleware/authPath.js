
/**
 * 过滤url中的非法请求
 */
const url = require('url');


module.exports = (req, res, next) => {

    let oldParams = url.parse(req.url).search;
    let deCodeParams = decodeURIComponent(oldParams);
    if (/[ <>@$^*()*]/.test(deCodeParams)) {
        console.log('包含特殊字符，不允许访问!');
        var pattern = new RegExp("[ <>@$^*()/*]");
        var newParams = "";
        for (var i = 0; i < deCodeParams.length; i++) {
            newParams += deCodeParams.substr(i, 1).replace(pattern, '');
        }
        res.redirect(url.parse(req.url).pathname + newParams);
    } else {
        next();
    }

}