const xss = require("xss");
const _ = require('lodash');
const {
    siteFunc
} = require("../../utils")
const mailTemplateRule = (ctx) => {
    return {

        comment: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("备注")])
        },


        title: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("标题")])
        },


        // subTitle: {
        //     type: "string",
        //     required: true,
        //     message: ctx.__("validate_error_field", [ctx.__("概要")])
        // },


        content: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("内容")])
        },


        type: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("类型")])
        },


    }
}



let MailTemplateController = {

    async list(ctx) {

        try {

            let payload = ctx.query;
            let queryObj = {};

            let mailTemplateList = await ctx.service.mailTemplate.find(payload, {
                query: queryObj,
                searchKeys: ['comment', 'title', 'subTitle'],
            });

            ctx.helper.renderSuccess(ctx, {
                data: mailTemplateList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async typelist(ctx) {

        try {

            let typeList = siteFunc.emailTypeKey();
            ctx.helper.renderSuccess(ctx, {
                data: typeList
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
                comment: fields.comment,
                title: fields.title,
                subTitle: fields.subTitle,
                content: xss(fields.content, {
                    onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
                        if (name === "style" || name === "class") {
                            return name + '="' + xss.escapeAttrValue(value) + '"';
                        }
                    }
                }),
                type: fields.type,
                createTime: new Date()
            }

            ctx.validate(mailTemplateRule(ctx), formObj);

            await ctx.service.mailTemplate.create(formObj);

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

            let targetItem = await ctx.service.mailTemplate.item(ctx, {
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
                comment: fields.comment,
                title: fields.title,
                subTitle: fields.subTitle,
                content: xss(fields.content, {
                    onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
                        if (name === "style" || name === "class") {
                            return name + '="' + xss.escapeAttrValue(value) + '"';
                        }
                    }
                }),
                type: fields.type,
                updateTime: new Date()
            }


            ctx.validate(mailTemplateRule(ctx), formObj);



            await ctx.service.mailTemplate.update(ctx, fields._id, formObj);

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
            await ctx.service.mailTemplate.removes(ctx, targetIds);
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },

}

module.exports = MailTemplateController;