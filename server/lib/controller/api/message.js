/*
 * @Author: doramart 
 * @Date: 2019-07-07 13:07:27 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-01 10:43:18
 */



const xss = require("xss");
const shortid = require('shortid');
const validator = require('validator');
const _ = require('lodash');

const {
    cache,
    siteFunc,
    validatorUtil
} = require('@utils');
const settings = require('@configs/settings');


const {
    userService,
    systemConfigService,
    contentTemplateService,
    contentTagService,
    contentService,
    messageService,
    adminUserService
} = require('@service');


exports.renderMessage = (userInfo = {}, messages = []) => {

    return new Promise(async (resolve, reject) => {
        try {
            let newMessageArr = JSON.parse(JSON.stringify(messages));
            for (const messageItem of newMessageArr) {

                let had_comment = false;
                let had_despises = false;
                let had_praise = false;
                if (!_.isEmpty(userInfo)) {
                    // 是否回复过
                    let myReplyRecord = await messageService.find({
                        isPaging: '0'
                    }, {
                        query: {
                            author: userInfo._id,
                            relationMsgId: messageItem._id
                        }
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
                let praise_num = await userService.count({
                    praiseMessages: messageItem._id
                });
                let despises_num = await userService.count({
                    despiseMessage: messageItem._id
                });
                messageItem.praise_num = praise_num;
                messageItem.despises_num = despises_num;
                messageItem.had_comment = had_comment;
                messageItem.had_despises = had_despises;
                messageItem.had_praise = had_praise;

                let parentId = messageItem._id;
                let childMessages = await messageService.find({
                    pageSize: 5,
                    isPaging: '0'
                }, {
                    query: {
                        relationMsgId: parentId
                    }
                })
                if (!_.isEmpty(childMessages)) {
                    messageItem.childMessages = childMessages;
                } else {
                    messageItem.childMessages = [];
                }
                messageItem.comment_num = await messageService.count({
                    relationMsgId: parentId
                })

            }

            resolve(newMessageArr);
        } catch (error) {
            resolve(messages);
        }
    })
}



exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let userId = req.query.userId;
        let contentId = req.query.contentId;
        let userInfo = req.session.user || {};
        let queryObj = {};

        if (userId) {
            queryObj.author = userId
        }

        if (contentId) {
            queryObj.contentId = contentId
        }

        let messageList = await messageService.find(payload, {
            query: queryObj
        });

        if (!_.isEmpty(userInfo)) {
            userInfo = await userService.item(res, {
                query: {
                    _id: userInfo._id
                }
            })
        }

        messageList.docs = await this.renderMessage(userInfo, messageList.docs);

        renderSuccess(req, res, {
            data: messageList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}

exports.postMessages = async (req, res, next) => {

    try {

        let fields = req.body;

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
            throw new Error(errMsg);
        }

        const messageObj = {
            contentId: fields.contentId,
            content: xss(fields.content),
            replyAuthor: fields.replyAuthor,
            author: req.session.user._id,
            relationMsgId: fields.relationMsgId,
            utype: fields.utype || '0',

        }

        let targetMessage = await messageService.create(messageObj);

        // 给被回复用户发送提醒邮件
        const systemConfigs = await systemConfigService.find({
            isPaging: '0'
        });
        const contentInfo = await contentService.item(res, {
            query: {
                _id: fields.contentId
            }
        })

        let replyAuthor;

        if (fields.replyAuthor) {
            replyAuthor = await UserModel.findOne({
                _id: fields.replyAuthor
            }, getAuthUserFields())
            replyAuthor = await userService.item(res, {
                query: {
                    _id: fields.replyAuthor
                },
                files: getAuthUserFields()
            })
        }

        if (!_.isEmpty(systemConfigs) && !_.isEmpty(contentInfo) && !_.isEmpty(replyAuthor)) {
            let mailParams = {
                replyAuthor: replyAuthor,
                content: contentInfo,
                author: req.session.user
            }
            service.sendEmail(req, res, systemConfigs[0], emailTypeKey.email_notice_user_contentMsg, mailParams);
        }

        // 发送消息给客户端
        let passiveUser = fields.replyAuthor ? fields.replyAuthor : contentInfo.uAuthor;
        siteFunc.addSiteMessage('3', req.session.user, passiveUser, targetMessage._id, {
            targetMediaType: '1'
        });

        let returnMessage = await messageService.item(res, {
            query: {
                _id: targetMessage._id
            }
        })

        renderSuccess(req, res, {
            data: returnMessage
        });
    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}