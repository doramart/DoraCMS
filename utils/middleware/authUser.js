/**
 * Created by Administrator on 2015/9/9.
 */
let settings = require('../../configs/settings');
let siteFunc = require('../siteFunc');
const shortid = require('shortid');
//用户实体类
const {
    User,
    UserNotify
} = require('../../server/lib/controller');

exports.auth = function (req, res, next) {

    if (req.session.user) {
        // let unReadMessageCount = UserNotify.getNoReadNotifyCountByUserId(req.session.user._id, 'user');
        // req.session.user.msg_count = unReadMessageCount;
        req.session.logined = true;
        return next();
    } else {
        let auth_token = req.signedCookies[settings.auth_cookie_name];
        // console.log('-auth_token-----', auth_token)
        if (!auth_token) {
            return next();
        } else {
            let auth = auth_token.split('$$$$');
            let user_id = auth[0];
            let tokeEncrypt = auth[1];
            if (!shortid.isValid(user_id) || tokeEncrypt != settings.encrypt_key) {
                return next();
            } else {
                User.getOneUserByParams({
                        '_id': user_id
                    })
                    .then((user) => {
                        if (!user) {
                            return next();
                        }
                        req.session.user = user;
                        req.session.logined = true;
                        return next();
                    });
            }
        }
    }
};