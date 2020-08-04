/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-07-05 18:06:07
 */
const Controller = require('egg').Controller;
const xss = require("xss");
const _ = require('lodash');

class HookController extends Controller {

    async list(ctx) {

        try {

            let payload = ctx.query;
            let queryObj = {};

            let hooksList = await ctx.service.hook.find(payload, {
                query: queryObj,
            });

            ctx.helper.renderSuccess(ctx, {
                data: hooksList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    }

    async create(ctx) {


        try {

            let fields = ctx.request.body || {};
            const formObj = {


                name: fields.name,




                description: fields.description,




                type: fields.type,




                ext: fields.ext,




                status: fields.status,



                createTime: new Date()
            }


            await ctx.service.hook.create(formObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }

    async getOne(ctx) {

        try {
            let _id = ctx.query.id;

            let targetItem = await ctx.service.hook.item(ctx, {
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


    async update(ctx) {


        try {

            let fields = ctx.request.body || {};
            const formObj = {


                name: fields.name,




                description: fields.description,




                type: fields.type,




                ext: fields.ext,




                status: fields.status,



                updateTime: new Date()
            }


            await ctx.service.hook.update(ctx, fields._id, formObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    }


    async removes(ctx) {

        try {
            let targetIds = ctx.query.ids;
            await ctx.service.hook.removes(ctx, targetIds);
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }

}

module.exports = HookController;