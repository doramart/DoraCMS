const BaseComponent = require('../prototype/baseComponent');
const ContentModel = require("../models").Content;
const ContentCategoryModel = require("../models").ContentCategory;
const ContentTagModel = require("../models").ContentTag;
const MessageModel = require("../models").Message;
const UserModel = require("../models").User;

const formidable = require('formidable');
const settings = require('../../../configs/settings');
const {
    service,
    validatorUtil,
    siteFunc
} = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash')
const xss = require("xss");
const moment = require("moment");
// markdown配置
const Marked = require('marked');
const hljs = require('highlight.js');
Marked.setOptions({
    highlight: function (code, lang) {
        if (hljs.getLanguage(lang)) {
            return hljs.highlight(lang, code).value
        } else {
            return hljs.highlightAuto(code).value
        }
    }
})


function checkFormData(req, res, fields) {
    let errMsg = '';

    // console.log('--fields---', fields)
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }

    if (!validatorUtil.isRegularCharacter(fields.title)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_content_title")
        });
    }
    if (!validator.isLength(fields.title, 2, 50)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 50,
            label: res.__("label_content_title")
        });
    }
    if (fields.stitle && !validator.isLength(fields.stitle, 2, 50)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 50,
            label: res.__("label_content_stitle")
        });
    }
    if (fields.type == '1' && !fields.tags) {
        errMsg = res.__("validate_selectNull", {
            label: res.__("label_content_tags")
        });
    }

    if (fields.type == '2' && !fields.categories) {
        errMsg = res.__("validate_userContent_category");
    }

    if (!fields.sImg) {
        errMsg = res.__("validate_selectNull", {
            label: res.__("lc_small_images")
        });
    }

    if (!validator.isLength(fields.discription, 5, 300)) {
        errMsg = res.__("validate_rangelength", {
            min: 5,
            max: 300,
            label: res.__("label_content_dis")
        });
    }

    if (fields.comments && !validator.isLength(fields.comments, 5, 100000)) {
        errMsg = res.__("validate_rangelength", {
            min: 5,
            max: 100000,
            label: res.__("label_content_comments")
        });
    }

    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}


function getCurrentTimeGate(startTime) {
    let currentTime = startTime.substring(0, 4) + '-' + startTime.substring(4, 6) + '-' + startTime.substring(6, 8) + ' ' + startTime.substring(8, 10) + ':' + startTime.substring(10, 12) + ':' + startTime.substring(12, 14);
    let date = new Date();
    let Y = date.getUTCFullYear() + '-';
    let M = (date.getUTCMonth() + 1 < 10 ? '0' + (date.getUTCMonth() + 1) : date.getUTCMonth() + 1) + '-';
    let D = date.getUTCDate();

    let mini = date.getUTCMinutes() < 10 ? '0' + date.getUTCMinutes() : date.getUTCMinutes();
    let endTime = Y + M + D + ' ' + date.getUTCHours() + ':' + mini + ':' + date.getUTCSeconds();
    return {
        start: currentTime,
        end: endTime
    }
}

function renderContentList(userId = "", contentList = [], useClient = '') {

    return new Promise(async (resolve, reject) => {
        try {
            let newContentList = JSON.parse(JSON.stringify(contentList));
            for (let contentItem of newContentList) {
                contentItem.id = contentItem._id;
                contentItem.hasPraised = false;
                contentItem.hasComment = false;
                contentItem.hasFavorite = false;
                contentItem.hasDespise = false;

                contentItem.uAuthor && (contentItem.uAuthor.had_followed = false);
                if (userId) {
                    let userInfo = await UserModel.findOne({
                        _id: userId
                    }, siteFunc.getAuthUserFields('session'));

                    if (!_.isEmpty(userInfo)) {
                        // 本人是否已点赞
                        if (userInfo.praiseContents && userInfo.praiseContents.indexOf(contentItem._id) >= 0) {
                            contentItem.hasPraised = true;
                        }
                        // 本人是否已收藏
                        if (userInfo.favorites && userInfo.favorites.indexOf(contentItem._id) >= 0) {
                            contentItem.hasFavorite = true;
                        }
                        // 本人是否已踩
                        if (userInfo.despises && userInfo.despises.indexOf(contentItem._id) >= 0) {
                            contentItem.hasDespise = true;
                        }
                        // 本人是否已留言
                        let contentMessage = await MessageModel.find({
                            contentId: contentItem._id,
                            author: userInfo._id
                        });
                        if (!_.isEmpty(contentMessage)) {
                            contentItem.hasComment = true;
                        }
                        // 本人是否已关注作者
                        if (userInfo.watchers.length > 0 && contentItem.uAuthor && userInfo.watchers.indexOf(contentItem.uAuthor._id) >= 0) {
                            contentItem.uAuthor.had_followed = true;
                        }
                    }

                }

                // 留言总数
                let commentNum = await MessageModel.count({
                    contentId: contentItem._id
                });
                contentItem.commentNum = commentNum;

                // 点赞总数
                let likeNum = await UserModel.count({
                    praiseContents: contentItem._id
                });
                contentItem.likeNum = likeNum;

                // 收藏总数
                let favoriteNum = await UserModel.count({
                    favorites: contentItem._id
                });
                contentItem.favoriteNum = favoriteNum;

                // 踩帖总数
                let despiseNum = await UserModel.count({
                    despises: contentItem._id
                });
                contentItem.despiseNum = despiseNum;

                if (contentItem.simpleComments && useClient == '2') {
                    contentItem.simpleComments = JSON.parse(contentItem.simpleComments);
                    contentItem.comments && delete contentItem.comments;
                }

                // 处理用户敏感信息
                contentItem.uAuthor && siteFunc.clearUserSensitiveInformation(contentItem.uAuthor);

            }

            resolve(newContentList);
        } catch (error) {
            resolve([]);
        }
    })

}


class Content {
    constructor() {
        // super()
    }
    async getContents(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let sortby = req.query.sortby; //排序规则
            let typeId = req.query.typeId; // 分类ID
            let isTop = req.query.isTop; // 推荐
            let tagName = req.query.tagName; // 文章tag
            let searchkey = req.query.searchkey; // 搜索关键字
            let keyword = req.query.keyword; // 搜索关键字
            let model = req.query.model || 'normal'; // 查询模式 full/normal/simple
            let state = req.query.state;
            let user = req.query.userId;
            let userInfo = req.session.user || {};
            let useClient = req.query.useClient;
            const type = req.query.type; // 文档类型 doctype用在服务端
            let searchState = '0';
            // 条件配置
            let queryObj = {
                uAuthor: {
                    $ne: null
                }
            };

            let sortObj = {};

            if (useClient != '0') {
                sortObj.roofPlacement = -1;
            }

            sortObj.date = -1;

            if (isTop) {
                queryObj.isTop = true;
            }

            if (sortby) {
                delete sortObj.date;
                delete sortObj.roofPlacement;
                sortObj[sortby] = -1;
                if (sortby == 'clickNum') {
                    let rangeTime = siteFunc.getDateStr(-720);
                    queryObj.date = {
                        "$gte": new Date(rangeTime.startTime),
                        "$lte": new Date(rangeTime.endTime)
                    }
                }
            }

            if (state) {
                queryObj.state = state
            } else {
                // 移动端只显示已审核的文章
                if (useClient == '2') {
                    queryObj.state = 2;
                } else {
                    queryObj.state = {
                        $ne: '0'
                    }
                }
            }

            if (type) {
                queryObj.type = type
            }

            if (typeId) {
                // queryObj.type = '2';
                queryObj.categories = typeId
            }

            if (user) {
                queryObj.uAuthor = user;
                if (userInfo._id == user) {
                    if (useClient == '1') {
                        delete queryObj.state;
                    } else if (useClient == '2') {
                        queryObj.state = '2'
                        if (req.query.areaType == '1') { // 如果是客户端用户中心
                            delete queryObj.state;
                        }
                    }
                }
            }

            if (tagName) {
                let targetTag = await ContentTagModel.findOne({
                    name: tagName
                });
                if (targetTag) {
                    queryObj.tags = targetTag._id;
                    // 如果有标签，则查询全部类别
                    delete queryObj.categories;
                }
            }

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i');
                queryObj.$or = [{
                    title: {
                        $regex: reKey
                    }
                }, {
                    comments: {
                        $regex: reKey
                    }
                }]
                searchState = '1';
            }

            if (keyword) {
                let reKey = new RegExp(keyword, 'i')
                queryObj.keywords = {
                    $regex: reKey
                }
            }

            if (useClient == '0') {
                model = null;
                delete queryObj.uAuthor;
            }
            // console.log('---queryObj--', queryObj)
            // console.log('---sortObj--', sortObj)
            const contents = await ContentModel.find(queryObj, siteFunc.getContentListFields(useClient, model)).sort(sortObj).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                    path: 'author',
                    select: 'userName name logo _id group'
                },
                {
                    path: 'uAuthor',
                    select: 'userName name logo _id group',
                    $match: {
                        group: '1'
                    }
                },
                {
                    path: 'categories',
                    select: 'name _id defaultUrl'
                }, {
                    path: 'tags',
                    select: 'name _id'
                }
            ]).exec();


            // console.log('--contents---', contents);
            const totalItems = await ContentModel.count(queryObj);

            let renderCurrentContents = contents;

            renderCurrentContents = (useClient != '0') ? await renderContentList(userInfo._id, contents, useClient) : contents;

            // console.log('--renderCurrentContents---', renderCurrentContents);

            let contentData = {
                docs: renderCurrentContents,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || '',
                    tagName: tagName || '',
                    user: user || '',
                    totalPage: Math.ceil(totalItems / pageSize),
                    state
                }
            };
            let renderContentData = siteFunc.renderApiData(req, res, 200, 'contentlist', contentData);
            if (modules && modules.length > 0) {
                return renderContentData.data;
            } else {
                if (req.query.useClient == '1') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'contentlist', contentData));
                } else if (req.query.useClient == '2') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'contentlist', renderCurrentContents));
                } else {
                    res.send(renderContentData);
                }
            }
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }


    async getTopIndexContents(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let model = req.query.model || 'normal'; // 查询模式 full/normal/simple
            let userInfo = req.session.user || {};
            let useClient = req.query.useClient;

            // 条件配置
            let queryObj = {
                state: '2',
                isTop: true,
                uAuthor: {
                    $ne: null
                }
            };

            let sortObj = {};

            if (useClient != '0') {
                sortObj.roofPlacement = -1;
            }

            sortObj.date = -1;

            let populateArr = [{
                    path: 'author',
                    select: 'userName name logo _id group'
                },
                {
                    path: 'uAuthor',
                    select: 'userName name logo _id group',
                    $match: {
                        group: '1'
                    }
                },
                {
                    path: 'categories',
                    select: 'name _id defaultUrl'
                }, {
                    path: 'tags',
                    select: 'name _id'
                }
            ];

            let recContents = [];

            if (!_.isEmpty(userInfo) && !_.isEmpty(userInfo.watchTags) && userInfo.watchTags.length > 0) {
                // 查询置顶文章
                let tagQuery = {
                    state: '2',
                    $or: [{
                        roofPlacement: 1
                    }, {
                        tags: {
                            $in: userInfo.watchTags
                        }
                    }]
                };

                let recContentsNum = await ContentModel.count(tagQuery);
                recContents = await ContentModel.find(tagQuery, siteFunc.getContentListFields(useClient, model)).sort(sortObj).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate(populateArr).exec();

                if (recContentsNum > current * pageSize) {
                    let renderCurrentContents = await renderContentList(userInfo._id, recContents, useClient);
                    res.send(siteFunc.renderApiData(req, res, 200, 'contentlist', renderCurrentContents));
                } else {

                    let leftNormalSize = current * pageSize - recContentsNum;
                    if (leftNormalSize <= pageSize) {

                        if (leftNormalSize > 0) {
                            let leftContents = await ContentModel.find({
                                state: '2',
                                tags: {
                                    $nin: userInfo.watchTags
                                }
                            }, siteFunc.getContentListFields(useClient, model)).sort(sortObj).skip(0).limit(Number(leftNormalSize)).populate(populateArr).exec();
                            recContents = _.concat(recContents, leftContents);
                        }

                    } else {
                        let leftContents = await ContentModel.find({
                            state: '2',
                            tags: {
                                $nin: userInfo.watchTags
                            }
                        }, siteFunc.getContentListFields(useClient, model)).sort(sortObj).skip(leftNormalSize).limit(Number(pageSize)).populate(populateArr).exec();
                        recContents = _.concat(recContents, leftContents);
                    }
                    let renderCurrentContents = await renderContentList(userInfo._id, recContents, useClient);
                    res.send(siteFunc.renderApiData(req, res, 200, 'contentlist', renderCurrentContents));

                }

            } else {
                const contents = await ContentModel.find(queryObj, siteFunc.getContentListFields(useClient, model)).sort(sortObj).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate(populateArr).exec();
                let renderCurrentContents = await renderContentList(userInfo._id, contents, useClient);
                res.send(siteFunc.renderApiData(req, res, 200, 'contentlist', renderCurrentContents));
            }

        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }

    // 查询我关注的大师内容列表
    async getMyFollowList(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let sortby = req.query.sortby; //排序规则
            let searchkey = req.query.searchkey; // 搜索关键字
            let user = req.session.user;
            let useClient = req.query.useClient;

            // 条件配置
            let queryObj = {
                    state: '2',
                    uAuthor: {
                        $in: user.watchers
                    }
                },
                sortObj = {
                    date: -1
                };

            if (sortby) {
                delete sortObj.date;
                sortObj[sortby] = -1;
                if (sortby == 'clickNum') {
                    let {
                        start,
                        end
                    } = getCurrentTimeGate('20160101000000');
                    // 查询2年内的热门文档
                    queryObj.date = {
                        "$gte": new Date(start),
                        "$lte": new Date(end)
                    }
                }
            }

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i')
                queryObj.comments = {
                    $regex: reKey
                }
                queryObj.type = '1'
            }

            // console.log('----queryObj---', queryObj);
            const contents = await ContentModel.find(queryObj, siteFunc.getContentListFields(useClient)).sort(sortObj).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                    path: 'author',
                    select: 'userName name logo _id group'
                },
                {
                    path: 'uAuthor',
                    select: 'userName name logo _id group',
                    match: {
                        followers: user._id
                    },
                    select: 'name -_id'
                }
            ]).exec();
            const totalItems = await ContentModel.count(queryObj);
            let contentData = {
                docs: contents,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || '',
                    totalPage: Math.ceil(totalItems / pageSize)
                }
            };
            let renderContentData = siteFunc.renderApiData(req, res, 200, 'contentlist', contentData);
            if (modules && modules.length > 0) {
                return renderContentData.data;
            } else {
                if (useClient == '2') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'contentlist', contents));
                } else {
                    res.send(renderContentData);
                }
            }
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }

    async getMyFavoriteContents(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let searchkey = req.query.searchkey;
            let useClient = req.query.useClient;
            let userId = req.query.userId;


            let queryObj = {
                state: '2'
            };

            if (userId) {
                let targetUser = await UserModel.findOne({
                    _id: userId
                });
                queryObj._id = {
                    $in: targetUser.favorites
                }
            }

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i')
                queryObj.name = {
                    $regex: reKey
                }
            }
            // console.log('---queryObj---', queryObj)
            let favoriteContents = await ContentModel.find(queryObj, siteFunc.getContentListFields(useClient)).sort({
                date: -1
            }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                    path: 'author',
                    select: 'userName name logo _id group'
                },
                {
                    path: 'uAuthor',
                    select: 'userName name logo _id group',
                    $match: {
                        group: '1'
                    }
                },
                {
                    path: 'categories',
                    select: 'name _id defaultUrl'
                }, {
                    path: 'tags',
                    select: 'name _id'
                }
            ]).exec();
            const totalItems = await ContentModel.count(queryObj);

            favoriteContents = (useClient != '0') ? await renderContentList(userId, favoriteContents, useClient) : favoriteContents;

            let specialData = {
                docs: favoriteContents,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || ''
                }
            };
            let renderContentData = siteFunc.renderApiData(req, res, 200, 'getMyFavoriteContents', specialData);
            if (modules && modules.length > 0) {
                return renderContentData.data;
            } else {
                if (useClient == '2') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'getMyFavoriteContents', favoriteContents));
                } else {
                    res.send(renderContentData);
                }
            }
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    // 查询我关注大师的文章以及我关注专题的文章
    async getMyAttentionContents(req, res) {
        try {

            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let userInfo = req.session.user;
            let useClient = req.query.useClient;
            let modules = req.query.modules;

            let targetUser = await UserModel.findOne({
                _id: userInfo._id
            }, siteFunc.getAuthUserFields('session'));

            let queryObj = {
                $or: [{
                    uAuthor: {
                        $in: targetUser.watchers
                    }
                }, {
                    categories: {
                        $in: targetUser.watchSpecials
                    }
                }]
            };
            let sortObj = {
                date: -1
            };
            queryObj = _.assign({}, queryObj, {
                state: '2'
            });

            const contents = await ContentModel.find(queryObj, siteFunc.getContentListFields(useClient)).sort(sortObj).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                    path: 'author',
                    select: 'userName name logo _id group'
                },
                {
                    path: 'uAuthor',
                    select: 'userName name logo _id group'
                },
                {
                    path: 'categories',
                    select: 'name defaultUrl _id enable'
                }, {
                    path: 'tags',
                    select: 'name _id'
                }
            ]).exec();
            const totalItems = await ContentModel.count(queryObj);

            let renderCurrentContents = await renderContentList(userInfo._id, contents, useClient);

            let contentData = {
                docs: renderCurrentContents,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    totalPage: Math.ceil(totalItems / pageSize)
                }
            };

            let renderContentData = siteFunc.renderApiData(req, res, 200, 'contentlist', contentData);
            if (modules && modules.length > 0) {
                return renderContentData.data;
            } else {
                if (useClient == '2') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'contentlist', renderCurrentContents));
                } else {
                    res.send(renderContentData);
                }
            }

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'save'));

        }
    }

    async getAllContens(req, res, next) {
        let files = req.query.contentfiles || null;
        return await ContentModel.find({
            'state': '2',
            type: '1'
        }, files);
    }

    async getOneContent(req, res, next) {

        let modules = req.query.modules;
        try {
            let targetId = req.query.id;
            let state = req.query.state;

            if (!shortid.isValid(targetId)) {
                throw new siteFunc.UserException(res.__('validate_error_params'));
            }

            let queryObj = {
                _id: targetId,
                uAuthor: {
                    $ne: null
                }
            };
            let useClient = req.query.useClient;
            let userInfo = req.session.user || {};

            if (state) {
                queryObj.state = state
            }

            if (useClient == '0') {
                delete queryObj.uAuthor;
            }

            await ContentModel.findOneAndUpdate(queryObj, {
                '$inc': {
                    'clickNum': 1
                }
            });
            const content = await ContentModel.findOne(queryObj).populate([{
                    path: 'author',
                    select: 'userName _id id logo'
                },
                {
                    path: 'uAuthor',
                    select: 'userName name logo _id group'
                },
                {
                    path: 'tags',
                    select: 'name _id'
                },
                {
                    path: 'categories',
                    select: 'name _id contentTemp enable defaultUrl',
                    populate: {
                        path: 'contentTemp'
                    }
                }
            ]).exec();

            let renderContentData = [],
                arrContent = [],
                contentData = {};


            // console.log('--content---', content)
            if (!_.isEmpty(content)) {
                arrContent.push(content);
                if (useClient == '0') {
                    renderContentData = arrContent;
                } else if (useClient == '1') {
                    if (content.state == '2' || (content.uAuthor && userInfo._id == content.uAuthor._id)) {
                        renderContentData = await renderContentList(userInfo._id, arrContent, useClient);
                    }
                } else if (useClient == '2') {
                    if (content.state == '2') {
                        renderContentData = await renderContentList(userInfo._id, arrContent, useClient);
                    }
                }
            } else {
                throw new siteFunc.UserException(res.__('validate_error_params'));
            }
            // console.log('--renderContentData[0]---', renderContentData[0])
            contentData = {
                doc: renderContentData[0] || {}
            };

            let renderData = siteFunc.renderApiData(req, res, 200, 'content', contentData, settings.user_action_type_browse)
            if (modules && modules.length > 0) {
                return renderData.data.doc;
            } else {
                if (useClient == '2' && !_.isEmpty(userInfo)) {
                    res.send(siteFunc.renderApiData(req, res, 200, 'content', renderContentData[0], settings.user_action_type_browse))
                } else {
                    res.send(renderData)
                }
            }

        } catch (err) {
            if (modules && modules.length > 0) {
                throw new siteFunc.UserException(err.message);
            } else {
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'));
            }
        }
    }

    async getMyContent(req, res, next) {
        try {

            let targetId = req.query.id;

            if (!shortid.isValid(targetId)) {
                throw new siteFunc.UserException(res.__('validate_error_params'));
            }

            let queryObj = {
                _id: targetId,
                uAuthor: req.session.user._id
            };

            const content = await ContentModel.findOne(queryObj).populate([{
                    path: 'author',
                    select: 'userName _id id logo'
                },
                {
                    path: 'uAuthor',
                    select: 'userName name logo _id group'
                },
                {
                    path: 'tags',
                    select: 'name _id'
                },
                {
                    path: 'categories',
                    select: 'name _id defaultUrl'
                }
            ]).exec();

            console.log('---content--', content)
            let renderData = siteFunc.renderApiData(req, res, 200, 'content', content, settings.user_action_type_browse)

            res.send(renderData)

        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'));
        }
    }
    // 获取随机文档
    async getRadomContents(req, res, next) {
        let queryObj = {};
        const enableCates = await ContentCategoryModel.find({
            enable: true
        }, 'id');
        let queryCate = enableCates.map((item, index) => {
            const reg = new RegExp(item.id, 'i')
            return {
                categories: {
                    $regex: reg
                }
            }
        })
        _.assign(queryObj, {
            $or: queryCate
        }, {
            type: '1',
            state: '2'
        })
        const totalContents = await ContentModel.count(queryObj);
        const randomArticles = await ContentModel.find(queryObj, 'stitle sImg title').skip(Math.floor(totalContents * Math.random())).limit(6);
        return {
            docs: randomArticles
        };
    }

    async updateLikeNum(req, res, next) {
        let targetId = req.query.contentId;
        let userId = req.session.user._id;
        try {
            let oldContent = await ContentModel.findOne({
                _id: targetId
            });
            if (!_.isEmpty(oldContent) && (oldContent.likeUserIds).indexOf(userId) > -1) {

                res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_error_repost"), 'update'));

            } else {
                let newContent = await ContentModel.findOneAndUpdate({
                    _id: targetId
                }, {
                    '$inc': {
                        'likeNum': 1
                    },
                    '$push': {
                        'likeUserIds': userId
                    }
                });

                res.send(siteFunc.renderApiData(req, res, 200, 'content', {
                    likeNum: newContent.likeNum + 1
                }, 'update'))
            }
        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
        }
    }

    async addContent(req, res, next) {
        const role = req.query.role;
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            try {

                await siteFunc.checkPostToken(req, res, fields.token);

                checkFormData(req, res, fields);

                let targetKeyWords = [];
                if (fields.keywords) {
                    if ((fields.keywords).indexOf(',') >= 0) {
                        targetKeyWords = (fields.keywords).split(',');
                    } else if ((fields.keywords).indexOf('，') >= 0) {
                        targetKeyWords = (fields.keywords).split('，');
                    }
                }

                const groupObj = {
                    title: fields.title,
                    stitle: fields.stitle,
                    type: fields.type,
                    categories: fields.categories,
                    // curriculumClass: fields.curriculumClass,
                    sortPath: fields.sortPath,
                    tags: fields.tags,
                    keywords: targetKeyWords,
                    sImg: fields.sImg,
                    // uAuthor: 'uUKsBv5y_',
                    author: !_.isEmpty(req.session.adminUserInfo) ? req.session.adminUserInfo._id : '',
                    state: fields.state,
                    dismissReason: fields.dismissReason,
                    isTop: fields.isTop,
                    // from: fields.from,
                    discription: xss(fields.discription),
                    comments: fields.comments,
                    simpleComments: xss(fields.simpleComments),
                    likeUserIds: [],
                    type: fields.type
                }

                // 设置显示模式
                let checkInfo = siteFunc.checkContentType(groupObj.simpleComments);
                groupObj.appShowType = checkInfo.type;
                groupObj.imageArr = checkInfo.imgArr;
                groupObj.videoArr = checkInfo.videoArr;
                if (checkInfo.type == '3') {
                    groupObj.videoImg = checkInfo.defaultUrl;
                }

                groupObj.simpleComments = siteFunc.renderSimpleContent(groupObj.simpleComments, checkInfo.imgArr, checkInfo.videoArr);

                if (role === 'user') {
                    // TODO 临时控制普通用户添加1天内不超过30篇
                    let rangeTime = siteFunc.getDateStr(-1);
                    let hadAddContentsNum = await ContentModel.count({
                        uAuthor: req.session.user._id,
                        date: {
                            "$gte": new Date(rangeTime.startTime),
                            "$lte": new Date(rangeTime.endTime)
                        }
                    });

                    if (hadAddContentsNum > 30) {
                        res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_forbid_more_req")))
                    }
                    groupObj.comments = xss(fields.comments);
                    groupObj.categories = Array(groupObj.categories);
                    groupObj.tags = Array(groupObj.tags);
                    groupObj.stitle = groupObj.title;
                    groupObj.uAuthor = req.session.user._id;
                    if (fields.draft == '1') {
                        groupObj.state = '0'
                    } else {
                        groupObj.state = '1'
                    }
                    groupObj.author = '';
                }

                // 如果是管理员代发,则指定用户
                if (req.session.adminUserInfo && fields.action == 'substitute' && fields.targetUser) {
                    groupObj.uAuthor = fields.targetUser;
                }

                const newContent = new ContentModel(groupObj);

                await newContent.save();

                let renderSendData = siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__('user_action_type_creat_content')
                }), {
                    id: newContent._id
                })

                res.send(renderSendData);
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'))
            }
        })
    }

    // 文章推荐
    async updateContentToTop(req, res, next) {

        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                const contentObj = {
                    isTop: fields.isTop
                }

                const item_id = fields._id;

                await ContentModel.findOneAndUpdate({
                    _id: item_id
                }, {
                    $set: contentObj
                });

                res.send(siteFunc.renderApiData(req, res, 200, 'content', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    // 文章置顶
    async roofPlacement(req, res, next) {

        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                const contentObj = {
                    roofPlacement: fields.roofPlacement
                }

                const item_id = fields._id;

                await ContentModel.findOneAndUpdate({
                    _id: item_id
                }, {
                    $set: contentObj
                });

                res.send(siteFunc.renderApiData(req, res, 200, 'roofPlacement', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }



    async updateContent(req, res, next) {
        const role = req.query.role;
        const useClient = req.query.useClient;
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                await siteFunc.checkPostToken(req, res, fields.token);

                checkFormData(req, res, fields);

                const contentObj = {
                    title: fields.title,
                    stitle: fields.stitle,
                    type: fields.type,
                    categories: fields.categories,
                    sortPath: fields.sortPath,
                    tags: fields.tags,
                    keywords: fields.keywords ? (fields.keywords).split(',') : [],
                    sImg: fields.sImg,
                    author: !_.isEmpty(req.session.adminUserInfo) ? req.session.adminUserInfo._id : '',
                    state: fields.state,
                    dismissReason: fields.dismissReason,
                    isTop: fields.isTop || '',
                    // from: fields.from,
                    discription: xss(fields.discription),
                    comments: fields.comments,
                    simpleComments: xss(fields.simpleComments),
                    type: fields.type
                }

                // 设置显示模式
                let checkInfo = siteFunc.checkContentType(contentObj.simpleComments);
                contentObj.appShowType = checkInfo.type;
                contentObj.imageArr = checkInfo.imgArr;
                contentObj.videoArr = checkInfo.videoArr;

                contentObj.simpleComments = siteFunc.renderSimpleContent(contentObj.simpleComments, checkInfo.imgArr, checkInfo.videoArr);

                if (checkInfo.type == '3') {
                    contentObj.videoImg = checkInfo.defaultUrl;
                }

                if (role === 'user') {
                    // contentObj.type = '1';
                    contentObj.comments = xss(fields.comments);
                    contentObj.stitle = contentObj.title;
                    contentObj.uAuthor = !_.isEmpty(req.session.user) ? req.session.user._id : fields.uAuthor.id;
                    // (role === 'user') && (contentObj.state = '0');
                    if (fields.draft == '1') {
                        contentObj.state = '0'
                    } else {
                        contentObj.state = '1'
                    }
                    contentObj.author = '';
                    // console.log('--contentObj--', contentObj)
                } else {

                }

                const item_id = fields._id;

                await ContentModel.findOneAndUpdate({
                    _id: item_id
                }, {
                    $set: contentObj
                });
                res.send(siteFunc.renderApiData(req, res, 200, 'content', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delContent(req, res, next) {
        try {
            let errMsg = '',
                targetIds = req.query.ids;
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            for (let i = 0; i < targetIds.length; i++) {
                // 删除关联留言
                await MessageModel.remove({
                    'contentId': {
                        $in: targetIds[i]
                    }
                });
            }

            await ContentModel.remove({
                '_id': {
                    $in: targetIds
                }
            });
            res.send(siteFunc.renderApiData(req, res, 200, 'content', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

    // 给文章分配用户
    async redictContentToUsers(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                let errMsg = '',
                    targetIds = fields.ids;
                let targetUser = fields.targetUser;

                if (!shortid.isValid(targetUser)) {
                    errMsg = res.__("validate_error_params");
                }

                if (!siteFunc.checkCurrentId(targetIds)) {
                    errMsg = res.__("validate_error_params");
                } else {
                    targetIds = targetIds.split(',');
                }

                let userInfo = await UserModel.findOne({
                    _id: targetUser
                }, 'group');

                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }

                await ContentModel.updateMany({
                    '_id': {
                        $in: targetIds
                    }
                }, {
                    $set: {
                        uAuthor: targetUser
                    }
                });

                res.send(siteFunc.renderApiData(req, res, 200, 'redictContentToUsers', {}, 'delete'))

            } catch (error) {
                res.send(siteFunc.renderApiErr(req, res, 500, error, 'redictContentToUsers'));
            }
        })
    }

    // 重新生成移动端文本
    async updateAppContent(req, res) {


        let contents = await ContentModel.find({
            simpleComments: null,
            state: '2'
        });

        // let idsArr = [];

        let htmlStr = '<ul>';

        for (const contentObj of contents) {

            // idsArr.push(contentObj._id)

            htmlStr += `<li><a href="http://localhost:8080/manage#/editContent/${contentObj._id}" target="_blank">${contentObj._id}</a></li>`
        }

        htmlStr += "</ul>"

        res.send(htmlStr)

    }


}

module.exports = new Content();