/*
 * @Author: doramart 
 * @Date: 2019-06-27 15:28:44 
 * @Discription: 针对登录页面的token校验
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-31 17:24:49
 */

const authToken = require('./jwtCheck');
const _ = require('lodash')
const settings = require('@configs/settings')
module.exports = async (req, res, next) => {

    try {
        req.session.adminUserInfo = "";
        req.session.adminPower = '';
        req.session.manageCates = '';
        req.session.adminlogined = false;
        let userToken = req.signedCookies['admin_' + settings.auth_cookie_name];
        if (userToken) {
            let checkToken = await authToken.checkToken(userToken);

            if (checkToken) {

                if (typeof checkToken == 'object') {
                    let targetUser = await reqJsonData('manage/adminUser/getOne', {
                        token: userToken,
                        id: checkToken._id,
                        password: checkToken.password
                    });

                    if (!_.isEmpty(targetUser)) {
                        console.log('adminuser had login');
                        // 查询权限菜单
                        let manageCates = await reqJsonData('manage/adminResource/getList', {
                            token: userToken,
                            isPaging: '0'
                        });
                        if (!_.isEmpty(manageCates)) {
                            req.session.manageCates = manageCates;
                        }
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
        req.session.loginOutState = error.message;
        next()
    }
}