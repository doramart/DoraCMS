const BaseComponent = require('../prototype/baseComponent');
const ContentModel = require("../models").Content;
const MessageModel = require("../models").Message;
const SystemConfigModel = require("../models").SystemConfig;
const UserModel = require("../models").User;
const AdminUserModel = require("../models").AdminUser;
const formidable = require('formidable');
const _ = require('lodash');
const shortid = require('shortid');
const validator = require('validator');
const xss = require("xss");
const { service, validatorUtil, siteFunc } = require('../../../utils');
const settings = require('../../../configs/settings');

class Message {
    constructor() {
        // super()
    }
    async getMessages(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let searchkey = req.query.searchkey;
            let contentId = req.query.contentId;
            let author = req.query.user;
            let queryObj = {};
            if (contentId) {
                queryObj.contentId = contentId;
            }
            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i')
                queryObj.content = { $regex: reKey }
            }
            if (author) {
                queryObj.author = author;
            }
            const messages = await MessageModel.find(queryObj).sort({
                date: -1
            }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'contentId',
                select: 'title stitle _id'
            }, {
                path: 'author',
                select: 'userName _id enable date logo'
            }, {
                path: 'replyAuthor',
                select: 'userName _id enable date logo'
            }, {
                path: 'adminAuthor',
                select: 'userName _id enable date logo'
            }, {
                path: 'adminReplyAuthor',
                select: 'userName _id enable date logo'
            }]).exec();
            const totalItems = await MessageModel.count(queryObj);

            let messageData = {
                docs: messages,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || '',
                    totalPage: Math.ceil(totalItems / pageSize)
                }
            };
            let renderData = siteFunc.renderApiData(res, 200, 'message', messageData, 'getlist');
            if (modules && modules.length > 0) {
                return renderData.data;
            } else {
                res.send(renderData);
            }

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async postMessages(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                let errMsg = '';
                if (_.isEmpty(req.session.user) && _.isEmpty(req.session.adminUserInfo)) {
                    errMsg = res.__("validate_error_params")
                }
                if (!shortid.isValid(fields.contentId)) {
                    errMsg = res.__("validate_message_add_err")
                }
                if (fields.content && (fields.content.length < 5 || fields.content.length > 200)) {
                    errMsg = res.__("validate_rangelength", { min: 5, max: 200, label: res.__("label_messages_content") })
                }
                if (!fields.content) {
                    errMsg = res.__("validate_inputNull", { label: res.__("label_messages_content") })
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }

            const messageObj = {
                contentId: fields.contentId,
                content: xss(fields.content),
                replyAuthor: fields.replyAuthor,
                adminReplyAuthor: fields.adminReplyAuthor,
                relationMsgId: fields.relationMsgId,
                utype: fields.utype || '0'
            }

            if (fields.utype === '1') { // 管理员
                messageObj.adminAuthor = req.session.adminUserInfo._id;
            } else {
                messageObj.author = req.session.user._id;
            }

            // console.log('----messageObj---', messageObj);
            const newMessage = new MessageModel(messageObj);
            try {
                let currentMessage = await newMessage.save();
                await ContentModel.findOneAndUpdate({ _id: fields.contentId }, { '$inc': { 'commentNum': 1 } })

                // 给被回复用户发送提醒邮件
                const systemConfigs = await SystemConfigModel.find({});
                const contentInfo = await ContentModel.findOne({ _id: fields.contentId });
                let replyAuthor;

                if (fields.replyAuthor) {
                    replyAuthor = await UserModel.findOne({ _id: fields.replyAuthor })
                } else {
                    replyAuthor = await AdminUserModel.findOne({ _id: fields.adminReplyAuthor });
                }

                if (!_.isEmpty(systemConfigs) && !_.isEmpty(contentInfo) && !_.isEmpty(replyAuthor)) {
                    let mailParams = {
                        replyAuthor: replyAuthor,
                        content: contentInfo
                    }
                    if (fields.utype === '1') {
                        mailParams.adminAuthor = req.session.adminUserInfo
                    } else {
                        mailParams.author = req.session.user
                    }
                    systemConfigs[0]['siteDomain'] = systemConfigs[0]['siteDomain'];
                    service.sendEmail(req, res, systemConfigs[0], settings.email_notice_user_contentMsg, mailParams);
                }

                // 针对用户留言添加积分
                // console.log('--准备加分--', fields.utype + '---' + req.session.user._id);
                if (messageObj.utype === '0') {
                    const addScore = systemConfigs[0]['postMessageScore'];
                    const newUser = await UserModel.findOneAndUpdate({ _id: req.session.user._id }, { '$inc': { 'integral': addScore } })
                    req.session.user = _.assign(req.session.user, { integral: newUser.integral + 5 })
                }

                res.send(siteFunc.renderApiData(res, 200, 'message', { id: newMessage._id }, 'save'))
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }


    async delMessage(req, res, next) {
        try {
            let errMsg = '', targetIds = req.query.ids;
            if (!siteFunc.checkCurrentId(targetIds)) {
                errMsg = res.__("validate_error_params");
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }

            for (let i = 0; i < targetIds.length; i++) {
                let msgObj = await MessageModel.findOne({ _id: targetIds[i] });
                if (msgObj) {
                    await ContentModel.findOneAndUpdate({ _id: msgObj.contentId }, { '$inc': { 'commentNum': -1 } })
                }
            }
            await MessageModel.remove({ '_id': { $in: targetIds } });

            res.send(siteFunc.renderApiData(res, 200, 'message', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }


}

module.exports = new Message();