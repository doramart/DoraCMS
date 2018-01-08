const BaseComponent = require('../prototype/baseComponent');
const ContentModel = require("../models").Content;
const ContentTagModel = require("../models").ContentTag;
const MessageModel = require("../models").Message;
const formidable = require('formidable');
const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash')

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
        errMsg = '非法请求，请稍后重试！';
    }
    if (!validator.isLength(fields.title, 5, 50)) {
        errMsg = '5-50个非特殊字符!';
    }
    if (fields.stitle && !validator.isLength(fields.stitle, 5, 50)) {
        errMsg = '5-50个非特殊字符!';
    }
    if (!fields.categories) {
        errMsg = '请选择文档类别!';
    }
    if (!fields.tags) {
        errMsg = '请选择文档标签!';
    }
    if (!validator.isLength(fields.discription, 5, 300)) {
        errMsg = '5-300个非特殊字符!';
    }
    if (fields.comments && !validator.isLength(fields.comments, 5)) {
        errMsg = '文档内容不得少于5个字符!';
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class Content {
    constructor() {
        // super()
    }
    async getContents(req, res, next) {
        try {
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

            // 条件配置
            let queryObj = {}, sortObj = { date: -1 }, files = null;

            if (isTop) {
                queryObj.isTop = isTop;
            }

            if (sortby) {
                delete sortObj.date;
                sortObj[sortby] = -1;
            }

            if (state) {
                queryObj.state = true
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
            }

            if (model === 'simple') {
                files = {
                    id: 1,
                    title: 1,
                    sImg: 1,
                    stitle: 1,
                    updateDate: 1
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
                    clickNum: 1,
                    discription: 1
                }
            }

            const contents = await ContentModel.find(queryObj, files).sort(sortObj).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'author',
                select: 'userName name logo -_id'
            },
            {
                path: 'uAuthor',
                select: 'userName name logo -_id'
            },
            {
                path: 'categories',
                select: 'name defaultUrl _id'
            }, {
                path: 'tags',
                select: 'name _id'
            }]).exec();
            const totalItems = await ContentModel.count(queryObj);
            res.send({
                state: 'success',
                docs: contents,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || ''
                }
            })
        } catch (err) {
            logUtil.error(err, req)
            res.send({
                state: 'error',
                type: 'ERROR_DATA',
                message: '获取Contents失败'
            })
        }
    }

    async getAllContens(req, res, next) {
        let files = req.query.contentfiles || null;
        return await ContentModel.find({ 'state': true }, files);
    }

    async getOneContent(req, res, next) {
        try {
            let targetId = req.query.id;
            let updateNum = req.query.apiSource == 'client' ? 1 : 0;
            const content = await ContentModel.findOneAndUpdate({ _id: targetId }, { '$inc': { 'clickNum': updateNum } }).populate([{
                path: 'author',
                select: 'userName name -_id'
            },
            {
                path: 'uAuthor',
                select: 'userName _id'
            },
            {
                path: 'tags',
                select: 'name _id'
            },
            {
                path: 'categories',
                select: 'name _id'
            }]).exec();
            const commentNum = await MessageModel.count({ contentId: targetId });
            content && (content.commentNum = commentNum);
            // 推荐文章查询
            const totalContents = await ContentModel.count({});
            const randomArticles = await ContentModel.find({}, 'stitle sImg').skip(Math.floor(totalContents * Math.random())).limit(6);
            res.send({
                state: 'success',
                doc: content || {},
                // messages,
                randomArticles
            })

        } catch (err) {
            logUtil.error(err, req)
            res.send({
                state: 'error',
                type: 'ERROR_DATA',
                message: '获取Content失败'
            })
        }
    }

    async updateLikeNum(req, res, next) {
        let targetId = req.query.contentId;
        let userId = req.session.user._id;
        try {
            let oldContent = await ContentModel.findOne({ _id: targetId });
            if (!_.isEmpty(oldContent) && (oldContent.likeUserIds).indexOf(userId) > -1) {
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_UPDATE_DATA',
                    message: '不可重复提交',
                })
            } else {
                let newContent = await ContentModel.findOneAndUpdate({ _id: targetId }, { '$inc': { 'likeNum': 1 }, '$push': { 'likeUserIds': userId } });
                res.send({
                    state: 'success',
                    likeNum: newContent.likeNum + 1
                });
            }
        } catch (error) {
            res.send({
                state: 'error',
                type: 'ERROR_IN_SAVE_DATA',
                message: '更新数据失败:' + error,
            })
        }
    }

    async addContent(req, res, next) {
        const role = req.query.role;
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return
            }

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
                discription: fields.discription,
                comments: fields.comments,
                likeUserIds: []
            }

            if (role === 'user') {
                // TODO 临时控制普通用户添加
                let hadAddContentsNum = await ContentModel.count({ uAuthor: req.session.user._id });
                if (hadAddContentsNum > 3) {
                    res.send({
                        state: 'error',
                        message: '您的操作太频繁，请歇会吧！'
                    });
                }
                groupObj.markDownComments = fields.markDownComments;
                groupObj.comments = marked(
                    (fields.markDownComments).replace(/<!--more-->/g, "")
                )
                groupObj.stitle = groupObj.title;
                groupObj.from = '3';
                groupObj.uAuthor = req.session.user._id;
                groupObj.state = false;
                groupObj.author = '';
            }

            const newContent = new ContentModel(groupObj);
            try {
                await newContent.save();
                res.send({
                    state: 'success',
                    id: newContent._id
                });
            } catch (err) {
                logUtil.error(err, req);
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: '保存数据失败:',
                })
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
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return
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
                comments: fields.comments
            }

            if (role === 'user' || fields.from === '3') {
                contentObj.markDownComments = fields.markDownComments;
                contentObj.comments = marked(
                    (fields.markDownComments).replace(/<!--more-->/g, "")
                )
                contentObj.stitle = contentObj.title;
                contentObj.from = '3';
                contentObj.uAuthor = req.session.user._id;
                (role === 'user') && (contentObj.state = false);
                contentObj.author = '';
            }

            const item_id = fields._id;
            try {
                await ContentModel.findOneAndUpdate({ _id: item_id }, { $set: contentObj });
                res.send({
                    state: 'success'
                });
            } catch (err) {
                logUtil.error(err, req);
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: '更新数据失败:',
                })
            }
        })

    }

    async delContent(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = '非法请求，请稍后重试！';
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await ContentModel.remove({ _id: req.query.ids });
            // 删除关联留言
            await MessageModel.remove({ 'contentId': { $in: req.query.ids } });
            res.send({
                state: 'success'
            });
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_IN_SAVE_DATA',
                message: '删除数据失败:' + err,
            })
        }
    }

}

module.exports = new Content();