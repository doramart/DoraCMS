/*
 * @Author: doramart 
 * @Date: 2019-08-16 14:51:46 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-09-30 09:34:47
 */

const {
    authToken
} = require('@utils');
const _ = require('lodash')
module.exports = (options, app) => {

    return async function authUserToken(ctx, next) {

        try {

            // if (ctx.originalUrl.indexOf('/manage/') < 0 &&
            //     ctx.originalUrl.indexOf('/admin/') < 0) {
            ctx.session.user = "";
            let userToken = ctx.cookies.get('api_' + app.config.auth_cookie_name);

            if (userToken) {

                let checkToken = await authToken.checkToken(userToken, app.config.encrypt_key);

                if (checkToken) {

                    if (typeof checkToken == 'object') {
                        let targetUser = await ctx.service.user.item(ctx, {
                            query: {
                                _id: checkToken.userId,
                            },
                            files: getAuthUserFields('session')
                        });
                        if (!_.isEmpty(targetUser)) {
                            // console.log('user had login');
                            ctx.session.user = targetUser;
                            ctx.session.user.token = userToken;
                            ctx.session.logined = true;
                        }
                    }

                }

            }
            // }

            await next();
        } catch (error) {
            throw new Error(error);
        }

    }

}