const BaseComponent = require('../prototype/baseComponent');
const ContentModel = require("../models").Content;
const ContentCategoryModel = require("../models").ContentCategory;
const ContentTagModel = require("../models").ContentTag;
const MessageModel = require("../models").Message;
const UserModel = require("../models").User;
const SystemConfigModel = require("../models").SystemConfig;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash')
const xss = require("xss");
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
function marked(text) {
    var tok = Marked.lexer(text)
    text = Marked.parser(tok).replace(/<pre>/ig, '<pre class="hljs">')
    return text
}

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!fields.categories) {
        errMsg = res.__("validate_selectNull", { label: res.__("label_content_cates") });
    }
    // 快讯不校验这些字段
    // console.log('----fields----', fields);
    if (fields.type != '2' && fields.type != '3') {
        if (!validator.isLength(fields.title, 2, 50)) {
            errMsg = res.__("validate_rangelength", { min: 2, max: 50, label: res.__("label_content_title") });
        }
        if (fields.stitle && !validator.isLength(fields.stitle, 2, 50)) {
            errMsg = res.__("validate_rangelength", { min: 2, max: 50, label: res.__("label_content_stitle") });
        }
        if (!fields.tags) {
            errMsg = res.__("validate_selectNull", { label: res.__("label_content_tags") });
        }
    }

    if (fields.type == '3') {
        if (!validator.isLength(fields.twiterAuthor, 2, 100)) {
            errMsg = res.__("validate_rangelength", { min: 2, max: 100, label: res.__("label_content_author") });
        }

        if (!validator.isLength(fields.translate, 5, 300)) {
            errMsg = res.__("validate_rangelength", { min: 5, max: 300, label: res.__("label_content_translate") });
        }
    } else {
        if (!validator.isLength(fields.discription, 5, 300)) {
            errMsg = res.__("validate_rangelength", { min: 5, max: 300, label: res.__("label_content_dis") });
        }
    }

    if (fields.comments && !validator.isLength(fields.comments, 5)) {
        errMsg = res.__("validate_minlength", { min: 5, label: res.__("label_content_comments") });
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
            let model = req.query.model; // 查询模式 full/normal/simple
            let state = req.query.state;
            let user = req.query.user;

            const type = req.query.type; // 文档类型 doctype用在服务端
            const contentType = req.query.contentType; // 页面类型

            // 条件配置
            let queryObj = {}, sortObj = { date: -1 }, files = null;

            if (isTop) {
                queryObj.isTop = isTop;
            }
            if (sortby) {
                delete sortObj.date;
                sortObj[sortby] = -1;
                if (sortby == 'clickNum') {
                    let { start, end } = getCurrentTimeGate('20160101000000');
                    // 查询2年内的热门文档
                    queryObj.date = { "$gte": new Date(start), "$lte": new Date(end) }
                }
            }

            if (state) {
                queryObj.state = state
            }

            if (type) {
                queryObj.type = type
            }

            if (typeId && typeId != 'indexPage') {
                queryObj.categories = typeId
            }

            if (user) {
                queryObj.uAuthor = user;
                model === 'normal'
            }

            if (tagName) {
                let targetTag = await ContentTagModel.findOne({ name: tagName });
                if (targetTag) {
                    queryObj.tags = targetTag._id;
                    // 如果有标签，则查询全部类别
                    delete queryObj.categories;
                }
            }

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i')
                queryObj.comments = { $regex: reKey }
                queryObj.type = '1'
            }

            if (model === 'simple') {
                files = {
                    id: 1,
                    title: 1,
                    sImg: 1,
                    stitle: 1,
                    date: 1,
                    updateDate: 1,
                    type: 1,
                    postValue: 1,
                    profitable: 1,
                    bearish: 1
                }
            } else if (model === 'normal') {
                files = {
                    id: 1,
                    title: 1,
                    sImg: 1,
                    isTop: 1,
                    author: 1,
                    uAuthor: 1,
                    categories: 1,
                    commentNum: 1,
                    date: 1,
                    updateDate: 1,
                    clickNum: 1,
                    discription: 1,
                    type: 1,
                    postValue: 1,
                    profitable: 1,
                    bearish: 1
                }
            }
            // 针对首页查询可见的类别
            if (type == '1') {
                const enableCates = await ContentCategoryModel.find({ enable: true }, 'id');
                let queryCate = enableCates.map((item, index) => {
                    const reg = new RegExp(item.id, 'i')
                    return { categories: { $regex: reg } }
                })
                _.assign(queryObj, { $or: queryCate })
            }
            // console.log('----queryObj---', queryObj);
            const contents = await ContentModel.find(queryObj, files).sort(sortObj).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'author',
                select: 'userName name logo _id'
            },
            {
                path: 'uAuthor',
                select: 'userName name logo _id'
            },
            {
                path: 'categories',
                select: 'name defaultUrl _id enable'
            }, {
                path: 'tags',
                select: 'name _id'
            }]).exec();
            const totalItems = await ContentModel.count(queryObj);
            let contentData = {
                docs: contents,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || '',
                    totalPage: Math.ceil(totalItems / pageSize),
                    state
                }
            };
            let renderContentData = siteFunc.renderApiData(res, 200, 'contentlist', contentData)
            if (modules && modules.length > 0) {
                return renderContentData.data;
            } else {
                res.send(renderContentData);
            }
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }

    async getAllContens(req, res, next) {
        let files = req.query.contentfiles || null;
        return await ContentModel.find({ 'state': true, type: '1' }, files);
    }

    async getOneContent(req, res, next) {
        try {
            let modules = req.query.modules;
            let targetId = req.query.id;
            let shareCode = req.query.uid;
            let state = req.query.state;
            let queryObj = { _id: targetId };

            if (state) {
                queryObj.state = true
            }
            const content = await ContentModel.findOneAndUpdate(queryObj, { '$inc': { 'clickNum': 1 } }).populate([{
                path: 'author',
                select: 'userName name -_id id'
            },
            {
                path: 'uAuthor',
                select: 'userName _id id'
            },
            {
                path: 'tags',
                select: 'name _id'
            },
            {
                path: 'categories',
                select: 'name _id enable defaultUrl contentTemp',
                populate: { path: 'contentTemp' }
            }]).exec();
            const commentNum = await MessageModel.count({ contentId: targetId });
            content && (content.commentNum = commentNum);

            // 被分享链接给用户加积分
            if (shareCode && shortid.isValid(shareCode)) {
                // 判断用户真实性
                let beShareUser = await UserModel.findOne({ _id: shareCode });
                if (!_.isEmpty(beShareUser) && beShareUser._id && req.session[shareCode] != 1) {
                    const systemConfigs = await SystemConfigModel.find({});
                    const { shareArticlScore } = systemConfigs[0];
                    await UserModel.findOneAndUpdate({ _id: beShareUser._id }, { '$inc': { 'integral': shareArticlScore } });
                    req.session[shareCode] = 1;
                } else {
                    console.log('--更新条件不成立--');
                }
            }

            let contentData = {
                doc: content || {}
            };
            let renderData = siteFunc.renderApiData(res, 200, 'content', contentData, 'getlist')
            if (modules && modules.length > 0) {
                return renderData.data.doc;
            } else {
                res.send(renderData)
            }

        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'));
        }
    }

    // 获取随机文档
    async getRadomContents(req, res, next) {
        let queryObj = {};
        const enableCates = await ContentCategoryModel.find({ enable: true }, 'id');
        let queryCate = enableCates.map((item, index) => {
            const reg = new RegExp(item.id, 'i')
            return { categories: { $regex: reg } }
        })
        _.assign(queryObj, { $or: queryCate }, { type: '1', state: true })
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
            let oldContent = await ContentModel.findOne({ _id: targetId });
            if (!_.isEmpty(oldContent) && (oldContent.likeUserIds).indexOf(userId) > -1) {

                res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_error_repost"), 'update'));

            } else {
                let newContent = await ContentModel.findOneAndUpdate({ _id: targetId }, { '$inc': { 'likeNum': 1 }, '$push': { 'likeUserIds': userId } });

                res.send(siteFunc.renderApiData(res, 200, 'content', { likeNum: newContent.likeNum + 1 }, 'update'))
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
                checkFormData(req, res, fields);
                const groupObj = {
                    title: fields.title,
                    stitle: fields.stitle,
                    type: fields.type,
                    categories: fields.categories,
                    sortPath: fields.sortPath,
                    tags: fields.tags,
                    keywords: fields.keywords,
                    sImg: fields.sImg,
                    author: !_.isEmpty(req.session.adminUserInfo) ? req.session.adminUserInfo._id : '',
                    state: fields.state,
                    isTop: fields.isTop,
                    from: fields.from,
                    discription: xss(fields.discription),
                    comments: xss(fields.comments),
                    likeUserIds: [],
                    translate: fields.translate,
                    twiterAuthor: fields.twiterAuthor,
                    type: fields.type,
                    postValue: fields.postValue
                }

                if (role === 'user') {
                    delete groupObj.postValue
                    // TODO 临时控制普通用户添加
                    let hadAddContentsNum = await ContentModel.count({ uAuthor: req.session.user._id });
                    if (hadAddContentsNum > 30) {
                        res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_forbid_more_req")))
                    }

                    groupObj.categories = Array(groupObj.categories);
                    groupObj.tags = Array(groupObj.tags);
                    groupObj.type = '1';
                    groupObj.stitle = groupObj.title;
                    groupObj.from = '3';
                    groupObj.uAuthor = req.session.user._id;
                    groupObj.state = false;
                    groupObj.author = '';
                }

                const newContent = new ContentModel(groupObj);

                await newContent.save();
                // 针对用户投稿添加积分
                if (role === 'user') {
                    const systemConfigs = await SystemConfigModel.find({});
                    const { poseArticlScore } = systemConfigs[0];
                    const newUser = await UserModel.findOneAndUpdate({ _id: req.session.user._id }, { '$inc': { 'integral': poseArticlScore } });
                    req.session.user = _.assign(req.session.user, { integral: newUser.integral + 5 })
                }

                let renderSendData = siteFunc.renderApiData(res, 200, 'addContent', { id: newContent._id })
                res.send(renderSendData);
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'))
            }
        })
    }

    async updateContent(req, res, next) {
        const role = req.query.role;
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }

            const contentObj = {
                title: fields.title,
                stitle: fields.stitle,
                type: fields.type,
                categories: fields.categories,
                sortPath: fields.sortPath,
                tags: fields.tags,
                keywords: fields.keywords,
                sImg: fields.sImg,
                author: !_.isEmpty(req.session.adminUserInfo) ? req.session.adminUserInfo._id : '',
                state: fields.state,
                isTop: fields.isTop,
                from: fields.from,
                discription: fields.discription,
                comments: fields.comments,
                translate: fields.translate,
                twiterAuthor: fields.twiterAuthor,
                type: fields.type,
                postValue: fields.postValue
            }

            if (role === 'user' || fields.from === '3') {
                contentObj.type = '1';
                contentObj.stitle = contentObj.title;
                contentObj.from = '3';
                contentObj.uAuthor = !_.isEmpty(req.session.user) ? req.session.user._id : fields.uAuthor.id;
                (role === 'user') && (contentObj.state = false);
                contentObj.author = '';
            }

            const item_id = fields._id;
            try {
                await ContentModel.findOneAndUpdate({ _id: item_id }, { $set: contentObj });
                res.send(siteFunc.renderApiData(res, 200, 'content', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delContent(req, res, next) {
        try {
            let errMsg = '', targetIds = req.query.ids;
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
                await MessageModel.remove({ 'contentId': { $in: targetIds[i] } });
            }

            await ContentModel.remove({ '_id': { $in: targetIds } });
            res.send(siteFunc.renderApiData(res, 200, 'content', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

}

module.exports = new Content();