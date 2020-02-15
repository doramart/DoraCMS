const xss = require("xss");
const _ = require('lodash');
const schedule = require('node-schedule');

const mailDeliveryRule = (ctx) => {
    return {

        emailType: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("邮件类型")])
        },


        timing: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("定时")])
        },


        comments: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("备注")])
        },


        type: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("任务类型")])
        },


    }
}


const sendEmailByTask = async (ctx, taskId, emailInfo, targetUser) => {
    try {
        await ctx.helper.reqJsonData('mailTemplate/sendEmail', {
            tempkey: "-1", // -1特指邮件群发
            info: {
                title: emailInfo.comments,
                targets: targetUser.email,
                content: emailInfo.content,
            }
        }, "post");

        await ctx.service.sendLog.create({
            taskId,
            recipient: targetUser._id,
            recipientEmail: targetUser.email,
            state: '1',
            createTime: new Date()
        });
    } catch (error) {
        await ctx.service.mailDelivery.update(ctx, taskId, {
            state: '1'
        });
        await ctx.service.sendLog.create({
            taskId,
            recipient: targetUser._id,
            recipientEmail: targetUser.email,
            state: '0',
            createTime: new Date()
        });
    }
}

const sendMailByTimingTask = async (ctx, taskId, emailInfo, targetUsers) => {
    if (!_.isEmpty(global.sendMailTimingTask)) {
        global.sendMailTimingTask.cancel();
    }

    global.sendMailTimingTask = schedule.scheduleJob(emailInfo.timing, async function () {
        if (!_.isEmpty(targetUsers)) {
            for (const userItem of targetUsers) {
                let targetUser;
                if (emailInfo.targetType == '0') {
                    targetUser = userItem;
                } else if (emailInfo.targetType == '1') {
                    targetUser = await ctx.service.user.item(ctx, {
                        query: {
                            _id: userItem,
                        },
                        files: "email"
                    });
                }
                sendEmailByTask(ctx, taskId, emailInfo, targetUser);
            }
        }
    });
}


const doSendEmailTask = async (ctx, fields, taskId) => {
    try {
        let targetUsers = fields.targets;

        // 全部用户
        if (fields.targetType == '0') {
            console.log('send to all users');
            targetUsers = await ctx.service.user.find({
                isPaging: '0'
            }, {
                files: "email"
            });
        }

        if (fields.type == '0') { // 立即发送

            for (const userItem of targetUsers) {
                let targetUser;
                if (fields.targetType == '0') {
                    targetUser = userItem;
                } else {
                    targetUser = await ctx.service.user.item(ctx, {
                        query: {
                            _id: userItem,
                        },
                        files: "email"
                    });
                }
                if (!_.isEmpty(targetUser)) {
                    sendEmailByTask(ctx, taskId, fields, targetUser);
                }
            }

            // 更新发送状态
            await ctx.service.mailDelivery.update(ctx, taskId, {
                state: '2'
            });
        } else if (fields.type == '1') { // 定时发送
            if (!fields.timing) {
                fields.timing = new Date();
            }

            sendMailByTimingTask(ctx, taskId, fields, targetUsers);

            await ctx.service.mailDelivery.update(ctx, taskId, {
                state: '2'
            });
        }
    } catch (error) {
        console.log('email send error', error);
    }
}

let MailDeliveryController = {

    async list(ctx) {

        try {

            let payload = ctx.query;
            let queryObj = {};

            let mailDeliveryList = await ctx.service.mailDelivery.find(payload, {
                query: queryObj,
                populate: ["sender", "emailType"],
                sort: {
                    createTime: -1
                }
            });

            ctx.helper.renderSuccess(ctx, {
                data: mailDeliveryList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async sendloglist(ctx) {

        try {

            let payload = ctx.query;
            let queryObj = {
                taskId: payload.taskId
            };

            let sendLogList = await ctx.service.sendLog.find(payload, {
                query: queryObj,
                populate: ["recipient"],
                sort: {
                    createTime: -1
                }
            });

            ctx.helper.renderSuccess(ctx, {
                data: sendLogList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async create(ctx) {


        try {

            let fields = ctx.request.body || {};
            let sendMailTask;
            const formObj = {
                sender: ctx.session.adminUserInfo._id,
                emailType: fields.emailType,
                state: "0",
                timing: fields.timing,
                comments: fields.comments,
                content: fields.content,
                type: fields.type,
                targets: fields.targets,
                targetType: fields.targetType,
                createTime: new Date()
            }

            ctx.validate(mailDeliveryRule(ctx), formObj);

            sendMailTask = await ctx.service.mailDelivery.create(formObj);


            doSendEmailTask(ctx, fields, sendMailTask._id);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },

    async getOne(ctx) {

        try {
            let _id = ctx.query.id;

            let targetItem = await ctx.service.mailDelivery.item(ctx, {
                query: {
                    _id: _id
                },
                populate: ["targets"]
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


    async update(ctx) {


        try {

            let fields = ctx.request.body || {};
            const formObj = {
                sender: ctx.session.adminUserInfo._id,
                emailType: fields.emailType,
                timing: fields.timing,
                comments: fields.comments,
                content: fields.content,
                type: fields.type,
                targets: fields.targets,
                targetType: fields.targetType,
                updateTime: new Date()
            }

            ctx.validate(mailDeliveryRule(ctx), formObj);

            await ctx.service.mailDelivery.update(ctx, fields._id, formObj);

            doSendEmailTask(ctx, fields, fields._id);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    },


    async removes(ctx) {

        try {
            let targetIds = ctx.query.ids;
            await ctx.service.mailDelivery.removes(ctx, targetIds);

            // 删除与该任务相关的发送记录
            await ctx.service.sendLog.removes(ctx, targetIds, 'taskId');
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },

}

module.exports = MailDeliveryController;