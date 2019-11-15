const xss = require("xss");
const _ = require('lodash');

const helpCenterRule = (ctx) => {
    return {
        name: {
            type: "string",
            required: true,
            min: 1,
            max: 50,
            message: ctx.__("validate_error_field", [ctx.__("label_tag_name")])
        },
        comments: {
            type: "string",
            required: true,
            min: 2,
            max: 200000,
            message: ctx.__("validate_inputCorrect", [ctx.__("label_comments")])
        }
    }
}



let HelpCenterController = {

    async list(ctx) {

        try {

            let payload = ctx.query;
            let helpType = ctx.query.helpType;
            let queryObj = {};

            if (helpType) {
                queryObj.type = helpType;
            }

            let helpCenterList = await ctx.service.helpCenter.find(payload, {
                query: queryObj,
                searchKeys: ['name'],
                populate: [{
                    path: 'user',
                    select: 'name userName _id'
                }]
            });

            ctx.helper.renderSuccess(ctx, {
                data: helpCenterList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async create(ctx) {


        try {

            let fields = ctx.request.body || {};
            const formObj = {
                name: fields.name,
                type: fields.type,
                lang: fields.lang,
                state: fields.state,
                user: ctx.session.adminUserInfo._id,
                comments: xss(fields.comments)
            }


            ctx.validate(helpCenterRule(ctx), formObj);



            await ctx.service.helpCenter.create(formObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },

    async getOne(ctx) {

        try {
            let _id = ctx.query.id;

            let targetItem = await ctx.service.helpCenter.item(ctx, {
                query: {
                    _id: _id
                }
            });

            ctx.helper.renderSuccess(ctx, {
                data: targetItem
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
                name: fields.name,
                state: fields.state,
                lang: fields.lang,
                type: fields.type,
                user: ctx.session.adminUserInfo._id,
                comments: xss(fields.comments),
                updateTime: new Date()
            }


            ctx.validate(helpCenterRule(ctx), formObj);



            await ctx.service.helpCenter.update(ctx, fields._id, formObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    },


    async removes(ctx) {

        try {
            let targetIds = ctx.query.ids;
            await ctx.service.helpCenter.removes(ctx, targetIds);
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },

}

module.exports = HelpCenterController;