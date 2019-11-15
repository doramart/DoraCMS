const xss = require("xss");
const _ = require('lodash');



let SiteMessageController = {

    async list(ctx, app) {

        try {

            let payload = ctx.query;
            let siteMessageList = await ctx.service.siteMessage.find(payload, {
                populate: [{
                    path: 'activeUser',
                    select: getAuthUserFields('base')
                }, {
                    path: 'passiveUser',
                    select: getAuthUserFields()
                }, {
                    path: 'content',
                    select: 'title _id'
                }, {
                    path: 'message',
                    select: 'content _id contentId',
                    populate: {
                        path: 'contentId',
                        select: 'title _id date'
                    }
                }]
            });

            ctx.helper.renderSuccess(ctx, {
                data: siteMessageList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },


    async getOne(ctx, app) {

        try {
            let _id = ctx.query.id;

            let targetUser = await ctx.service.siteMessage.item(ctx, {
                query: {
                    _id: _id
                }
            });

            ctx.helper.renderSuccess(ctx, {
                data: targetUser
            });

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }

    },


    async removes(ctx, app) {

        try {
            let targetIds = ctx.query.ids;
            await ctx.service.siteMessage.removes(ctx, targetIds);
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }

}



module.exports = SiteMessageController;