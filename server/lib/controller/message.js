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
const {
    service,
    validatorUtil,
    siteFunc
} = require('../../../utils');
const settings = require('../../../configs/settings');

function renderMessage(userInfo = {}, messages = [], useClient = '') {

    return new Promise(async (resolve, reject) => {
        try {
            let newMessageArr = JSON.parse(JSON.stringify(messages));
            for (const messageItem of newMessageArr) {

                let had_comment = false;
                let had_despises = false;
                let had_praise = false;
                if (!_.isEmpty(userInfo)) {
                    userInfo = await UserModel.findOne({
                        _id: userInfo._id
                    }, siteFunc.getAuthUserFields('session'));
                    // 是否回复过
                    let myReplyRecord = await MessageModel.find({
                        author: userInfo._id,
                        relationMsgId: messageItem._id
                    });
                    if (myReplyRecord.length > 0) {
                        had_comment = true;
                    }
                    // 是否踩过
                    if (userInfo.despiseMessage.indexOf(messageItem._id) >= 0) {
                        had_despises = true;
                    }
                    // 是否赞过
                    if (userInfo.praiseMessages.indexOf(messageItem._id) >= 0) {
                        had_praise = true;
                    }
                }
                let praise_num = await UserModel.count({
                    praiseMessages: messageItem._id
                });
                let despises_num = await UserModel.count({
                    despiseMessage: messageItem._id
                });
                messageItem.praise_num = praise_num;
                messageItem.despises_num = despises_num;
                messageItem.had_comment = had_comment;
                messageItem.had_despises = had_despises;
                messageItem.had_praise = had_praise;

                if (useClient == '2') {
                    let parentId = messageItem._id;
                    let childMessages = await MessageModel.find({
                        relationMsgId: parentId
                    }).sort({
                        date: -1
                    }).skip(0).limit(5).populate([{
                        path: 'contentId',
                        select: 'title stitle _id'
                    }, {
                        path: 'author',
                        select: 'userName _id enable date logo'
                    }]).exec();
                    if (!_.isEmpty(childMessages)) {
                        messageItem.childMessages = childMessages;
                    } else {
                        messageItem.childMessages = [];
                    }
                    messageItem.comment_num = await MessageModel.count({
                        relationMsgId: parentId
                    })
                }
            }
            resolve(newMessageArr);
        } catch (error) {
            resolve(messages);
        }
    })
}


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
            let author = req.query.author;
            let useClient = req.query.useClient;
            let userInfo = req.session.user;

            let queryObj = {};
            if (contentId) {
                queryObj.contentId = contentId;
            } else {
                if (useClient != '0' && !author) {
                    // throw new siteFunc.UserException(res.__('label_systemnotice_nopower'));
                }
            }

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i')
                queryObj.content = {
                    $regex: reKey
                }
            }

            if (author) {
                queryObj.author = author;
            }

            // console.log('---queryObj--', queryObj)

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

            let renderMessageData = await renderMessage(userInfo, messages);

            let messageData = {
                docs: renderMessageData,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || '',
                    totalPage: Math.ceil(totalItems / pageSize)
                }
            };
            let renderData = siteFunc.renderApiData(req, res, 200, 'message', messageData, 'getlist');
            if (modules && modules.length > 0) {
                return renderData.data;
            } else {
                if (useClient == '2') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'message', renderMessageData, 'getlist'));
                } else {
                    res.send(renderData);
                }
            }

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }


    async getAppMessages(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let searchkey = req.query.searchkey;
            let contentId = req.query.contentId;
            let useClient = req.query.useClient;
            let userInfo = req.session.user;

            let queryObj = {
                $or: [{
                    relationMsgId: ''
                }, {
                    relationMsgId: {
                        $exists: false
                    }
                }]
            };

            if (contentId) {
                queryObj.contentId = contentId;
            } else {
                if (useClient != '0') {
                    // throw new siteFunc.UserException(res.__('label_systemnotice_nopower'));
                }
            }

            // console.log('---queryObj--', queryObj)

            // 查询一级留言
            const messages = await MessageModel.find(queryObj).sort({
                date: -1
            }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'contentId',
                select: 'title stitle _id'
            }, {
                path: 'author',
                select: 'userName _id enable date logo'
            }]).exec();

            const totalItems = await MessageModel.count(queryObj);

            let renderMessages = await renderMessage(userInfo, messages, useClient);

            let messageData = {
                docs: renderMessages,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || '',
                    totalPage: Math.ceil(totalItems / pageSize)
                }
            };
            let renderData = siteFunc.renderApiData(req, res, 200, 'message', messageData, 'getlist');
            if (modules && modules.length > 0) {
                return renderData.data;
            } else {
                if (useClient != '0') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'message', renderMessages, 'getlist'));
                } else {
                    res.send(renderData);
                }
            }

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async postMessages(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                await siteFunc.checkPostToken(req, res, fields.token);

                let errMsg = '';
                if (_.isEmpty(req.session.user) && _.isEmpty(req.session.adminUserInfo)) {
                    errMsg = res.__("validate_error_params")
                }
                if (!shortid.isValid(fields.contentId)) {
                    errMsg = res.__("validate_message_add_err")
                }
                if (fields.content && (fields.content.length < 5 || fields.content.length > 200)) {
                    errMsg = res.__("validate_rangelength", {
                        min: 5,
                        max: 200,
                        label: res.__("label_messages_content")
                    })
                }
                if (!fields.content) {
                    errMsg = res.__("validate_inputNull", {
                        label: res.__("label_messages_content")
                    })
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
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

                let targetMessage = await newMessage.save();
                await ContentModel.findOneAndUpdate({
                    _id: fields.contentId
                }, {
                    '$inc': {
                        'commentNum': 1
                    }
                })

                // 给被回复用户发送提醒邮件
                const systemConfigs = await SystemConfigModel.find({});
                const contentInfo = await ContentModel.findOne({
                    _id: fields.contentId
                });
                let replyAuthor;

                if (fields.replyAuthor) {
                    replyAuthor = await UserModel.findOne({
                        _id: fields.replyAuthor
                    }, siteFunc.getAuthUserFields())
                } else {
                    replyAuthor = await AdminUserModel.findOne({
                        _id: fields.adminReplyAuthor
                    });
                }

                // if (!_.isEmpty(systemConfigs) && !_.isEmpty(contentInfo) && !_.isEmpty(replyAuthor)) {
                //     let mailParams = {
                //         replyAuthor: replyAuthor,
                //         content: contentInfo
                //     }
                //     if (fields.utype === '1') {
                //         mailParams.adminAuthor = req.session.adminUserInfo
                //     } else {
                //         mailParams.author = req.session.user
                //     }
                //     systemConfigs[0]['siteDomain'] = systemConfigs[0]['siteDomain'];
                //     service.sendEmail(req, res, systemConfigs[0], settings.email_notice_user_contentMsg, mailParams);
                // }

                // 发送消息给客户端
                let passiveUser = fields.replyAuthor ? fields.replyAuthor : contentInfo.uAuthor;
                siteFunc.addSiteMessage('3', req.session.user, passiveUser, targetMessage._id, {
                    targetMediaType: '1'
                });

                let returnMessage = await MessageModel.findOne({
                    _id: newMessage._id
                }).populate([{
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
                res.send(siteFunc.renderApiData(req, res, 200, 'message', returnMessage, settings.user_action_type_comment, 'postMessage'))
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }


    async delMessage(req, res, next) {
        try {
            let errMsg = '',
                targetIds = req.query.ids;
            if (!siteFunc.checkCurrentId(targetIds)) {
                errMsg = res.__("validate_error_params");
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }

            for (let i = 0; i < targetIds.length; i++) {
                let msgObj = await MessageModel.findOne({
                    _id: targetIds[i]
                });
                if (msgObj) {
                    await ContentModel.findOneAndUpdate({
                        _id: msgObj.contentId
                    }, {
                        '$inc': {
                            'commentNum': -1
                        }
                    })
                }
            }
            await MessageModel.remove({
                '_id': {
                    $in: targetIds
                }
            });

            res.send(siteFunc.renderApiData(req, res, 200, 'message', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }


}

module.exports = new Message();