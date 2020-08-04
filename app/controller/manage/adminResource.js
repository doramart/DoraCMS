/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-02 00:15:44
 */
const Controller = require('egg').Controller;
const {
    adminResourceRule
} = require('@validate')


const xss = require("xss");
const _ = require('lodash');
const {
    siteFunc
} = require('@utils');

class AdminResourceController extends Controller {
    async list() {
        const {
            ctx,
            service
        } = this;
        try {

            let payload = ctx.query;
            _.assign(payload, {
                pageSize: 1000
            });
            let adminResourceList = await ctx.service.adminResource.find(payload);

            ctx.helper.renderSuccess(ctx, {
                data: adminResourceList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    }

    async listByPower() {
        const {
            ctx,
            service
        } = this;
        try {

            let payload = {
                isPaging: '0'
            };
            _.assign(payload, {
                pageSize: 1000
            });
            let manageCates = await ctx.service.adminResource.find(payload, {
                files: 'api _id label enable routePath parentId type icon comments'
            });
            let adminPower = await ctx.helper.getAdminPower(ctx);
            let currentCates = await siteFunc.renderNoPowerMenus(manageCates, adminPower);

            ctx.helper.renderSuccess(ctx, {
                data: currentCates
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    }

    async alllist() {
        return await ctx.service.adminResource.find({
            isPaging: '0'
        }, {
            type: '1'
        })
    }

    async create() {

        const {
            ctx,
            service
        } = this;
        try {

            let fields = ctx.request.body || {};
            const formObj = {
                label: fields.label,
                type: fields.type,
                api: fields.api,
                parentId: fields.parentId,
                sortId: fields.sortId,
                routePath: fields.routePath,
                icon: fields.icon,
                componentPath: fields.componentPath,
                enable: fields.enable,
                comments: fields.comments
            }


            ctx.validate(adminResourceRule.form(ctx), formObj);

            if (fields.type == '0' && !fields.label) {
                formObj.label = fields.routePath;
            }

            await ctx.service.adminResource.create(formObj);

            ctx.helper.renderSuccess(ctx);
        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }

    }



    async getOne() {
        const {
            ctx,
            service
        } = this;
        try {
            let _id = ctx.query.id;

            let targetItem = await ctx.service.adminResource.item(ctx, {
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

    }


    async update() {

        const {
            ctx,
            service
        } = this;
        try {

            let fields = ctx.request.body || {};
            const formObj = {
                label: fields.label,
                type: fields.type,
                api: fields.api,
                parentId: fields.parentId,
                sortId: fields.sortId,
                routePath: fields.routePath,
                icon: fields.icon,
                componentPath: fields.componentPath,
                enable: fields.enable,
                comments: fields.comments
            }


            ctx.validate(adminResourceRule.form(ctx), formObj);


            let oldResource;
            if (fields.type == '0') {
                oldResource = await ctx.service.adminResource.item(ctx, {
                    query: {
                        label: fields.label
                    }
                })
            } else {
                oldResource = await ctx.service.adminResource.item(ctx, {
                    query: {
                        parentId: fields.parentId,
                        comments: fields.comments
                    }
                })
            }

            if (!_.isEmpty(oldResource) && oldResource._id != fields._id) {
                throw new Error(ctx.__("user_action_tips_repeat", [ctx.__('label_resourceName')]));
            }

            await ctx.service.adminResource.update(ctx, fields._id, formObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    }


    async updateParentId() {

        try {
            const {
                ctx,
                service
            } = this;

            let fields = ctx.request.body || {};

            const formObj = {
                parentId: fields.parentId,
            }

            let oldResource = await ctx.service.adminResource.item(ctx, {
                query: {
                    label: fields.label
                }
            })

            if (!_.isEmpty(oldResource) && oldResource._id != fields._id) {
                throw new Error(ctx.__("user_action_tips_repeat", [ctx.__('label_resourceName')]));
            }

            await ctx.service.adminResource.update(ctx, fields._id, formObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    }


    async removes() {
        const {
            ctx,
            service
        } = this;
        try {
            let targetIds = ctx.query.ids;
            // 删除主类
            await ctx.service.adminResource.removes(ctx, targetIds);
            // 删除子类
            await ctx.service.adminResource.removes(ctx, targetIds, 'parentId');
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }

}

module.exports = AdminResourceController;