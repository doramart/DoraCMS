const settings = require("../configs/settings");

function _clearSession(req) {
    req.session.adminlogined = false;
    req.session.adminPower = '';
    req.session.adminUserInfo = '';
}
module.exports = (req, res, next) => {

    const authorization = req.session.adminlogined;
    if (!authorization) {
        res.send({ state: 'error', err: 'tokenExpiredError', data: { pageInfo: {}, docs: [] } });// 登录超时
    } else {
        next();
    }

}