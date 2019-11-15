/*
 * @Author: doramart 
 * @Date: 2019-09-23 14:44:21 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-09-24 15:27:38
 */

const _ = require('lodash');

const {
    cache,
} = require('../../utils');


let ContentTemplateController = {

    async getDefaultTempInfo(ctx, app) {

        let defaultTemp = await ctx.service.contentTemplate.item(ctx, {
            query: {
                'using': true
            },
            populate: ['items']
        })
        if (!_.isEmpty(defaultTemp)) {
            // 缓存1天
            cache.set(app.config.session_secret + '_default_temp', defaultTemp, 1000 * 60 * 60 * 24);
            ctx.helper.renderSuccess(ctx, {
                data: defaultTemp
            });
        } else {
            ctx.helper.renderSuccess(ctx, {
                data: {}
            });
        }

    }


}

module.exports = ContentTemplateController;