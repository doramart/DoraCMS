const BaseComponent = require('../prototype/baseComponent');
const SiteMessageModel = require("../models").SiteMessage;
const UserNotifyModel = require("../models").UserNotify;
const ContentModel = require("../models").Content;
const formidable = require('formidable');
const {
    service,
    validatorUtil,
    siteFunc
} = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash')
const settings = require('../../../configs/settings');


function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!validator.isLength(fields.content, 2, 30)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 30,
            label: res.__("label_comments")
        });
    }
    if (!type) {
        errMsg = res.__("validate_selectNull", {
            label: res.__("label_cate_name")
        });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

function renderUserList(userId = '', messageList = [], listType = '') {

    return new Promise(async (resolve, reject) => {
        try {
            let newMessageList = JSON.parse(JSON.stringify(messageList));
            for (let messageItem of newMessageList) {

                let userItem = messageItem.activeUser;

                if (messageItem.type == '1') {


                } else if (messageItem.type == '2') {
                    let userContentsNum = await ContentModel.count({
                        uAuthor: userItem._id,
                        state: '2'
                    });
                    userItem.content_num = userContentsNum;
                    userItem.watch_num = userItem.watchers.length;
                    userItem.follow_num = userItem.followers.length;
                    userItem.had_followed = false;
                    if (userId) {
                        if (userItem.followers.indexOf(userId) >= 0) {
                            userItem.had_followed = true;
                        }
                    }
                }
                // 清除敏感信息
                siteFunc.clearUserSensitiveInformation(userItem);
            }
            // console.log('----listType-----', listType)
            // 排序
            if (listType == '2') {
                newMessageList = _.sortBy(newMessageList, (item) => {
                    return !item.activeUser.had_followed
                })
            }
            resolve(newMessageList);

        } catch (error) {
            resolve([]);
        }
    })

}

class SiteMessage {
    constructor() {
        // super()
    }
    async getSiteMessages(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let model = req.query.model; // 查询模式 full/simple
            let useClient = req.query.useClient;
            let type = req.query.type;
            let userInfo = req.session.user;
            let queryObj = {};

            if (!_.isEmpty(userInfo)) {
                queryObj.passiveUser = userInfo._id;
            } else {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }

            if (model === 'full') {
                pageSize = '1000'
            }

            if (type) {
                queryObj.type = type;
            }

            const siteMessages = await SiteMessageModel.find(queryObj).sort({
                date: -1
            }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'activeUser',
                select: siteFunc.getAuthUserFields('base')
            }, {
                path: 'passiveUser',
                select: siteFunc.getAuthUserFields()
            }, {
                path: 'content',
                select: 'title _id'
            }, {
                path: 'message',
                select: 'content _id contentId',
                populate: {
                    path: 'contentId',
                    select: 'title _id date'
                }
            }]).exec();
            const totalItems = await SiteMessageModel.count(queryObj);

            let renderSiteMessages = await renderUserList(userInfo._id, siteMessages, type);

            let siteMessageData = {
                docs: renderSiteMessages,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            };
            let renderSiteMessageData = siteFunc.renderApiData(req, res, 200, 'SiteMessage', siteMessageData);
            if (modules && modules.length > 0) {
                return renderSiteMessageData.data;
            } else {
                if (useClient == '2') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'getSiteMessages', renderSiteMessages));
                } else {
                    res.send(renderSiteMessageData);
                }
            }
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    // 获取私信概要
    async getSiteMessageOutline(req, res, next) {
        try {
            let userInfo = req.session.user;
            let populateArr = [{
                path: 'activeUser',
                select: '_id userName'
            }, {
                path: 'passiveUser',
                select: '_id userName'
            }, {
                path: 'content',
                select: 'title _id',
                populate: {
                    path: 'uAuthor',
                    select: 'userName'
                }
            }, {
                path: 'message',
                select: 'content _id contentId',
                populate: {
                    path: 'contentId',
                    select: 'title _id date'
                }
            }];
            // 获取未读消息数量
            let noReadGoodNum = await SiteMessageModel.count({
                isRead: false,
                type: '4',
                passiveUser: userInfo._id
            });
            let noReadGoodContent = await SiteMessageModel.find({
                type: '4',
                passiveUser: userInfo._id
            }).sort({
                date: -1
            }).limit(1).populate(populateArr).exec();
            let noReadFollowNum = await SiteMessageModel.count({
                isRead: false,
                type: '2',
                passiveUser: userInfo._id
            });
            let noReadFollowContent = await SiteMessageModel.find({
                type: '2',
                passiveUser: userInfo._id
            }).sort({
                date: -1
            }).limit(1).populate(populateArr).exec();
            let noReadCommentNum = await SiteMessageModel.count({
                isRead: false,
                type: '3',
                passiveUser: userInfo._id
            });
            let noReadCommentContent = await SiteMessageModel.find({
                type: '3',
                passiveUser: userInfo._id
            }).sort({
                date: -1
            }).limit(1).populate(populateArr).exec();

            let userNotify_num = await UserNotifyModel.count({
                isRead: false,
                user: userInfo._id
            });
            let userNotifyContent = await UserNotifyModel.find({
                isRead: false,
                user: userInfo._id
            }).populate('notify').exec();

            let renderData = {
                first_privateLetter: userNotifyContent[0] || {},
                private_no_read_num: userNotify_num,
                no_read_good_num: noReadGoodNum,
                first_good_message: noReadGoodContent[0] || {},
                no_read_follow_num: noReadFollowNum,
                first_follow_message: noReadFollowContent[0] || {},
                no_read_comment_num: noReadCommentNum,
                first_comment_message: noReadCommentContent[0] || {},
            }

            res.send(siteFunc.renderApiData(req, res, 200, 'getSiteMessageOutline', renderData));

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'getSiteMessageOutline'))
        }
    }

    async addSiteMessage(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                // checkFormData(req, res, fields);

                const tagObj = {
                    type: fields.type,
                    activeUser: fields.activeUser,
                    passiveUser: fields.passiveUser,
                    isRead: false,
                    content: fields.content
                }
                const newSiteMessage = new SiteMessageModel(tagObj);

                await newSiteMessage.save();

                res.send(siteFunc.renderApiData(req, res, 200, 'SiteMessage', {
                    id: newSiteMessage._id
                }, 'save'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

    async updateSiteMessage(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
                const userObj = {
                    type: fields.type,
                    hasSend: false,
                    content: fields.content
                }
                const item_id = fields._id;

                await SiteMessageModel.findOneAndUpdate({
                    _id: item_id
                }, {
                    $set: userObj
                });
                res.send(siteFunc.renderApiData(req, res, 200, 'SiteMessage', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delSiteMessage(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await SiteMessageModel.remove({
                _id: req.query.ids
            });
            res.send(siteFunc.renderApiData(req, res, 200, 'SiteMessage', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

    async setMessageHasRead(req, res, next) {
        try {
            let errMsg = '',
                targetIds = req.query.ids;
            let messageType = req.query.type;
            let query = {};
            // 用户只能操作自己的消息
            let userInfo = req.session.user;
            if (!_.isEmpty(userInfo)) {
                query.passiveUser = userInfo._id;
            } else {
                throw new siteFunc.UserException(res.__(res.__("validate_error_params")))
            }

            // 设置我所有未读的为已读
            if (targetIds == 'all') {
                if (messageType) {
                    query.type = messageType;
                }
                query.isRead = false;
            } else {
                if (!siteFunc.checkCurrentId(targetIds)) {
                    errMsg = res.__("validate_error_params");
                } else {
                    targetIds = targetIds.split(',');
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }
                query['_id'] = {
                    $in: targetIds
                };
            }

            await SiteMessageModel.update(query, {
                $set: {
                    'isRead': true
                }
            }, {
                multi: true
            });

            res.send(siteFunc.renderApiData(req, res, 200, res.__("resdata_setnoticeread_success"), {}, 'update'));

        } catch (error) {

            res.send(siteFunc.renderApiErr(req, res, 500, res.__("resdata_setnoticeread_error", {
                error: error.message
            }), 'update'));

        }

    }



}

module.exports = new SiteMessage();