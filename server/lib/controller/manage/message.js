/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-25 14:10:11
 */


const {
    messageService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');
const {
    siteFunc,
} = require('@utils');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;

        let messageList = await messageService.find(payload, {

        });

        renderSuccess(req, res, {
            data: messageList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}

exports.create = async (req, res, next) => {

    try {
        let fields = req.body || {};
        if (_.isEmpty(req.session.user) && _.isEmpty(req.session.adminUserInfo)) {
            throw new Error(res.__("validate_error_params"))
        }

        const formObj = {
            contentId: fields.contentId,
            content: xss(fields.content),
            replyAuthor: fields.replyAuthor,
            adminReplyAuthor: fields.adminReplyAuthor,
            relationMsgId: fields.relationMsgId,
            utype: fields.utype || '0'
        }

        let errInfo = validateForm(res, 'message', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        if (fields.utype === '1') { // 管理员
            formObj.adminAuthor = req.session.adminUserInfo._id;
        } else {
            formObj.author = req.session.user._id;
        }

        let targetMessage = await messageService.create(formObj);


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



exports.getOne = async (req, res, next) => {
    try {
        let _id = req.query.id;

        let targetItem = await messageService.item(res, {
            query: {
                _id: _id
            }
        });

        renderSuccess(req, res, {
            data: targetItem
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }

}



exports.removes = async (req, res, next) => {
    try {
        let targetIds = req.query.ids;
        await messageService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}