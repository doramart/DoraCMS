/*
 * @Author: doramart 
 * @Date: 2019-07-15 17:25:08 
 * @Discription 设置跨域访问
 * @Last Modified by:   doramart 
 * @Last Modified time: 2019-07-15 17:25:08 
 */


module.exports = (req, res, next) => {

    res.header('Access-Control-Allow-Origin', res.header('origin') || '*');
    res.header('Access-Control-Allow-Headers', 'x-requested-with');
    res.header('Access-Control-Request-Method', 'GET,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();

}