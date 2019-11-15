/*
 * @Author: doramart 
 * @Date: 2019-09-23 14:44:21 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-09-29 17:46:53
 */

const versionManageRule = (ctx) => {
    return {
        title: {
            type: "string",
            required: true,
            message: ctx.__("validate_inputCorrect", [ctx.__("label_version_title")])
        },
        description: {
            type: "string",
            required: true,
            message: ctx.__("validate_inputCorrect", [ctx.__("label_version_description")])
        },
        version: {
            type: "number",
            required: true,
            message: ctx.__("validate_inputCorrect", [ctx.__("label_version_version")])
        },
        versionName: {
            type: "string",
            required: true,
            message: ctx.__("validate_inputCorrect", [ctx.__("label_version_versionName")])
        },
    }
}



let VersionManageController = {

    async list(ctx) {
        try {

            let payload = ctx.query;
            let client = ctx.query.client;
            let queryObj = {};

            if (client) {
                if (client != '0' && client != '1') {
                    throw new Error(ctx.__('validate_error_params'));
                } else {
                    queryObj.client = client;
                }
            }

            let versionInfoCount = await ctx.service.versionManage.count();
            if (versionInfoCount == 0) {
                let configObj = {
                    "date": new Date(),
                    "description": "新增自动更新",
                    "forcibly": false,
                    "title": "有更新啦1",
                    "url": "",
                    "version": 1,
                    "client": client,
                    "versionName": "1.0"
                }
                await ctx.service.versionManage.create(configObj);
            }

            let versionManageList = await ctx.service.versionManage.find(payload, {
                query: queryObj
            });

            ctx.helper.renderSuccess(ctx, {
                data: versionManageList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },


    async getOne(ctx) {
        try {
            let _id = ctx.query.id;

            let targetUser = await ctx.service.versionManage.item(ctx, {
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


    async update(ctx) {

        try {

            let fields = ctx.request.body || {};
            const formObj = {
                title: fields.title,
                description: fields.description,
                version: fields.version,
                versionName: fields.versionName,
                forcibly: fields.forcibly,
                url: fields.url
            }


            ctx.validate(versionManageRule(ctx), formObj);



            await ctx.service.versionManage.update(ctx, fields._id, formObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    }

}

module.exports = VersionManageController;