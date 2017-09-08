const settings = require("./settings");

function _clearSession(req) {
    req.session.adminlogined = false;
    req.session.adminPower = '';
    req.session.adminUserInfo = '';
}
module.exports = (req, res, next) => {

    const authorization = req.session.adminlogined;
    if (!authorization) {
        res.send({ state: 'error', err: 'tokenExpiredError' });// 登录超时
    } else {
        next();
    }

}