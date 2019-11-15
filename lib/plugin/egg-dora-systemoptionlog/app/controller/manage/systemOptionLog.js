/*
 * @Author: doramart 
 * @Date: 2019-09-23 14:44:21 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-09-23 15:54:20
 */

let SystemOptionLogController = {

    async list(ctx) {

        try {

            let payload = ctx.query;
            let systemOptionLogList = await ctx.service.systemOptionLog.find(payload);

            ctx.helper.renderSuccess(ctx, {
                data: systemOptionLogList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },


    async removes(ctx) {

        try {
            let targetIds = ctx.query.ids;
            await ctx.service.systemOptionLog.removes(ctx, targetIds);
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },

    async removeAll(ctx) {

        try {

            await ctx.service.systemOptionLog.removeAll();
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }
}

module.exports = SystemOptionLogController;