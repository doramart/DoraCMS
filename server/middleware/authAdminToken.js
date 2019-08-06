/*
 * @Author: doramart 
 * @Date: 2019-06-27 15:28:44 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-02 10:50:05
 */


const authToken = require('./jwtCheck');
const {
    adminUserService
} = require('@service')
const _ = require('lodash')
const settings = require('@configs/settings')
module.exports = async (req, res, next) => {

    try {
        req.session.adminUserInfo = "";
        req.session.adminPower = '';
        req.session.adminlogined = false;
        let userToken = '';
        let getTokenFromCookie = req.signedCookies['admin_' + settings.auth_cookie_name];

        if (req.method == 'GET') {
            userToken = req.query.token || getTokenFromCookie;
        } else if (req.method == 'POST') {
            userToken = req.body.token || getTokenFromCookie;
        }
        if (userToken) {
            let checkToken = await authToken.checkToken(userToken);

            if (checkToken) {

                if (typeof checkToken == 'object') {
                    let targetUser = await adminUserService.item(res, {
                        query: {
                            _id: checkToken._id,
                            password: checkToken.password
                        },
                        populate: [{
                            path: 'group',
                            select: 'power _id enable name'
                        }],
                        files: {
                            password: 0,
                            email: 0
                        }
                    })
                    if (!_.isEmpty(targetUser)) {
                        console.log('adminuser had login');
                        req.session.adminUserInfo = targetUser;
                        req.session.adminPower = targetUser.group.power;
                        req.session.adminlogined = true;
                        next();
                    } else {
                        throw new Error('tokenError');
                    }
                } else {
                    throw new Error('tokenError');
                }

            } else {
                throw new Error('tokenError');
            }
        } else {
            throw new Error('tokenError');
        }
    } catch (error) {
        res.send({
            state: 'error',
            err: error.message,
            data: {
                pageInfo: {},
                docs: []
            }
        }); // 登录超时
    }


}