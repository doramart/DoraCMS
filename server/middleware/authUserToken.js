/*
 * @Author: doramart 
 * @Date: 2019-07-12 09:54:29 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-15 15:47:55
 */

let settings = require('@configs/settings');
const _ = require('lodash');

module.exports = async (req, res, next) => {

    try {
        req.session.user = "";
        let userToken = req.signedCookies['api_' + settings.auth_cookie_name];

        if (userToken) {

            let targetUser = await reqJsonData('user/userInfo', {
                token: userToken
            });
            if (!_.isEmpty(targetUser)) {
                console.log('user had login');
                req.session.user = targetUser;
                req.session.user.token = userToken;
                req.session.logined = true;
                next();
            } else {
                throw new Error('tokenError');
            }

        } else {
            throw new Error('tokenError');
        }
    } catch (error) {
        // console.log('user without login');
        next();
    }

};