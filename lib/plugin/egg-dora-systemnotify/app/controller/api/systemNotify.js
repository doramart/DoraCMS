const _ = require('lodash');

let SystemNotifyController = {


    /**
     * @api {get} /api/systemNotify/getUserNotifys 获取系统公告
     * @apiDescription 获取系统公告，带分页，需要登录态
     * @apiName /systemNotify/getUserNotifys
     * @apiGroup SystemNotify
     * @apiParam {string} current 当前页码
     * @apiParam {string} pageSize 每页记录数
     * @apiParam {string} token 登录时返回的参数鉴权
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *{
     *    "status": 200,
     *    "message": "操作成功 userNotify",
     *    "server_time": 1542530587287,
     *    "data": [
     *        {
     *            "_id": "myh0RzkV3H",
     *            "user": "zwwdJvLmP",
     *            "notify": {
     *               "_id": "5mCBWXS-B",
     *               "title": "这是一条私信，不要偷偷打开哟。。。",
     *               "content": "<p>这是一条私信，不要偷偷打开哟。。。</p>",
     *               "date": "2018-11-18 16:43:07",
     *               "id": "5mCBWXS-B"
     *            },
     *            "__v": 0,
     *            "date": "2018-11-18 16:13:47",
     *            "isRead": false,
     *            "id": "myh0RzkV3H"
     *       }
     *    ]
     *}
     * @apiSampleRequest http://localhost:8080/api/systemNotify/getUserNotifys
     * @apiVersion 1.0.0
     */
    async getUserNotifys(ctx, app) {

        try {

            let payload = ctx.query;
            let userNotifyList = await ctx.service.systemNotify.find(payload, {
                query: {
                    user: ctx.session.user._id
                },
                populate: [{
                    path: 'notify',
                    select: 'title content _id'
                }]
            });

            ctx.helper.renderSuccess(ctx, {
                data: userNotifyList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async delUserNotify(ctx, app) {

        try {
            let targetIds = ctx.query.ids;
            if (!checkCurrentId(targetIds)) {
                throw new Error(ctx.__("validate_error_params"));
            } else {

                let ids = targetIds.split(',');
                // 删除消息记录
                for (let i = 0; i < ids.length; i++) {
                    const userNotifyId = ids[i];
                    let userNotifyObj = await ctx.service.systemNotify.item(ctx, {
                        query: {
                            '_id': userNotifyId,
                            user: ctx.session.user._id
                        }
                    })
                    if (!_.isEmpty(userNotifyObj)) {
                        // await ctx.service.announce.removes(ctx, userNotifyObj.notify);
                    }
                }

            }

            await ctx.service.systemNotify.removes(ctx, targetIds);
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },



    /**
     * @api {get} /api/systemNotify/setNoticeRead 设置系统公告为已读
     * @apiDescription 设置系统公告为已读
     * @apiName /systemNotify/setNoticeRead
     * @apiGroup SystemNotify
     * @apiParam {string} ids 消息id,多个id用逗号隔开,全部传 all
     * @apiParam {string} token 登录时返回的参数鉴权
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *{
     *    "status": 200,
     *    "message": "设置已读成功",
     *    "server_time": 1542529985218,
     *    "data": {}
     *}
     * @apiSampleRequest http://localhost:8080/api/systemNotify/setNoticeRead
     * @apiVersion 1.0.0
     */
    async setMessageHasRead(ctx, app) {


        try {
            let targetIds = ctx.query.ids;
            let queryObj = {};
            let errMsg = '';
            // 用户只能操作自己的消息
            let userInfo = ctx.session.user || {};
            if (_.isEmpty(userInfo)) {
                throw new Error(ctx.__(ctx.__("validate_error_params")))
            } else {
                queryObj.user = ctx.session.user._id;
            }

            if (targetIds == 'all') {
                queryObj.isRead = true;
            } else {
                queryObj['_id'] = {
                    $in: targetIds
                };
            }

            await ctx.service.systemNotify.updateMany(ctx, targetIds, {
                'isRead': true
            }, queryObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    }

}

module.exports = SystemNotifyController;