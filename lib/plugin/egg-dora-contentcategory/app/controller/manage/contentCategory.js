const xss = require("xss");
const _ = require('lodash');

const contentCategoryRule = (ctx) => {
    return {
        name: {
            type: "string",
            required: true,
            min: 2,
            max: 20,
            message: ctx.__("validate_error_field", [ctx.__("label_cate_name")])
        },
        defaultUrl: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("label_cate_seourl")])
        },
        comments: {
            type: "string",
            required: true,
            min: 4,
            max: 100,
            message: ctx.__("validate_inputCorrect", [ctx.__("label_comments")])
        }
    }
}



let ContentCategoryController = {

    async list(ctx, app) {

        try {

            let payload = ctx.query;
            let queryObj = {};

            let categoryParams = _.assign({}, payload, {
                isPaging: '0'
            })
            let contentCategoryList = await ctx.service.contentCategory.find(categoryParams, {
                searchKeys: ['name'],
                query: queryObj
            });

            ctx.helper.renderSuccess(ctx, {
                data: contentCategoryList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async create(ctx, app) {


        try {

            let fields = ctx.request.body || {};
            const formObj = {
                name: fields.name,
                keywords: fields.keywords,
                sortId: fields.sortId,
                parentId: fields.parentId,
                enable: fields.enable,
                defaultUrl: fields.defaultUrl,
                contentTemp: fields.contentTemp,
                comments: fields.comments,
                sImg: fields.sImg,
                type: fields.type
            }

            // 兼容中文逗号
            if (fields.keywords) {
                var reg = new RegExp('，', "g")
                formObj.keywords = (fields.keywords).replace(reg, ',');
            }

            // 针对子类自动继承父类的模板
            if (fields.parentId != '0') {
                let parentCate = await ctx.service.contentCategory.item(ctx, {
                    query: {
                        '_id': fields.parentId
                    }
                })
                if (!_.isEmpty(parentCate)) {
                    formObj.contentTemp = parentCate.contentTemp;
                }
            }

            ctx.validate(contentCategoryRule(ctx), formObj);

            let cateObj = await ctx.service.contentCategory.create(formObj);
            // 更新sortPath defaultUrl
            let newQuery = {};
            if (fields.parentId == '0') {
                newQuery.sortPath = '0,' + cateObj._id
            } else {
                let parentObj = await ctx.service.contentCategory.item(ctx, {
                    query: {
                        '_id': fields.parentId
                    },
                    files: 'sortPath defaultUrl'
                })
                newQuery.sortPath = parentObj.sortPath + "," + cateObj._id;
                newQuery.defaultUrl = parentObj.defaultUrl + '/' + fields.defaultUrl
            }
            await ctx.service.contentCategory.update(ctx, cateObj._id, newQuery);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },



    async getOne(ctx, app) {

        try {
            let _id = ctx.query.id;

            let targetItem = await ctx.service.contentCategory.item(ctx, {
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

    async alllist(ctx, app) {
        return await ctx.service.contentCategory.find({
            isPaging: '0'
        })
    },


    async update(ctx, app) {


        try {

            let fields = ctx.request.body || {};
            const formObj = {
                name: fields.name,
                keywords: fields.keywords,
                sortId: fields.sortId,
                parentId: fields.parentId,
                enable: fields.enable,
                defaultUrl: fields.defaultUrl,
                contentTemp: fields.contentTemp,
                sortPath: fields.sortPath,
                comments: fields.comments,
                sImg: fields.sImg,
                type: fields.type
            }

            // 针对子类自动继承父类的模板
            if (fields.parentId == '0' && fields.contentTemp) {
                await ctx.service.contentCategory.updateMany(ctx, [], {
                    contentTemp: fields.contentTemp
                }, {
                    'parentId': fields._id
                })
            }

            ctx.validate(contentCategoryRule(ctx), formObj);

            await ctx.service.contentCategory.update(ctx, fields._id, formObj);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    },


    async removes(ctx, app) {

        try {
            let targetIds = ctx.query.ids;
            let contentCountInCates = await ctx.service.content.count({
                categories: targetIds
            })

            if (contentCountInCates > 0) {
                throw new Error("请先删除该分类下的文章！");
            } else {
                // 删除主分类
                await ctx.service.contentCategory.removes(ctx, targetIds);
                // 删除子类
                await ctx.service.contentCategory.removes(ctx, targetIds, 'parentId');
                ctx.helper.renderSuccess(ctx);
            }

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }

}

module.exports = ContentCategoryController;