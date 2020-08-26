const _ = require('lodash');
const fs = require('fs');
const {
    siteFunc
} = require('../../utils')
let ContentCategoryController = {


    async list(ctx, app) {

        try {

            let payload = ctx.query;

            let queryObj = {
                enable: true
            };

            // 获取当前默认模板信息
            let defaultTemp = await ctx.helper.reqJsonData('contentTemplate/getDefaultTempInfo');

            let contentCategoryList = await ctx.service.contentCategory.find({
                isPaging: '0',
                lean: '1'
            }, {
                query: queryObj,
                populate: ['contentTemp']
            });

            let removeArr = [];

            for (const item of contentCategoryList) {
                item.url = `/${item.defaultUrl}___${item._id}`;
                let cateContentsNum = await ctx.helper.reqJsonData(`content/getContentCountsByCateId?typeId=${item._id}`);
                if (!_.isEmpty(cateContentsNum) && !_.isEmpty(cateContentsNum[0])) {
                    item.postCount = cateContentsNum[0].total_sum;
                }
                if (!_.isEmpty(item.contentTemp)) {
                    if (item.parentId != '0' && item.contentTemp.forder) {
                        let currentPath = `${process.cwd()}/app/view/${defaultTemp.alias}/${item.contentTemp.forder}`;
                        // console.log('--currentPath--', currentPath)
                        if (!fs.existsSync(currentPath)) {
                            removeArr.push(item._id);
                            removeArr.push(item.parentId);
                        }
                    }
                } else {
                    removeArr.push(item._id);
                }

            }

            removeArr = _.uniq(removeArr);

            _.remove(contentCategoryList, function (cate) {
                return removeArr.indexOf(cate._id) >= 0
            })

            ctx.helper.renderSuccess(ctx, {
                data: contentCategoryList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async treelist(ctx, app) {

        let queryObj = {
            enable: true
        };

        let contentCategoryList = await ctx.service.contentCategory.find({
            isPaging: '0'
        }, {
            query: queryObj
        });

        let newCateList = JSON.parse(JSON.stringify(contentCategoryList));
        let renderCates = siteFunc.buildTree(newCateList);

        ctx.helper.renderSuccess(ctx, {
            data: renderCates
        });
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

    // 根据类别id或者文档id查询子类
    async getCurrentCategoriesById(ctx, app) {

        try {
            let contentId = ctx.query.contentId;
            let typeId = ctx.query.typeId;
            let cates = [],
                parents = [];

            let contentObj = await ctx.service.content.item(ctx, {
                query: {
                    '_id': contentId
                },
                files: 'categories',
                populate: [{
                    path: 'categories',
                    select: 'name _id'
                }]
            })

            if (typeId || !_.isEmpty(contentObj)) {
                let fullNav = await ctx.service.contentCategory.find({
                    isPaging: '0'
                });
                let parentTypeId = typeId ? typeId : (contentObj.categories)[0]._id;

                let parentObj = _.filter(fullNav, (doc) => {
                    return doc._id == parentTypeId;
                });

                if (parentObj.length > 0) {
                    let parentId = parentObj[0].sortPath.split(',')[1] || '0';
                    cates = _.filter(fullNav, (doc) => {
                        return (doc.sortPath).indexOf(parentId) > 0
                    });
                    parents = _.filter(cates, (doc) => {
                        return doc.parentId === '0'
                    });
                }
            }

            ctx.helper.renderSuccess(ctx, {
                data: {
                    parents,
                    cates
                }
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    }


}

module.exports = ContentCategoryController;
