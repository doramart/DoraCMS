const xss = require("xss");
const _ = require('lodash');
const {
    siteFunc
} = require("../../utils")
//邮件发送插件
const nodemailer = require("nodemailer");
const moment = require("moment");

let MailTemplateController = {

    async list(ctx) {

        try {

            let payload = ctx.query;
            let queryObj = {};

            let mailTemplateList = await ctx.service.mailTemplate.find(payload, {
                query: queryObj,
                searchKeys: ['comment', 'title', 'subTitle'],
            });

            ctx.helper.renderSuccess(ctx, {
                data: mailTemplateList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async typelist(ctx) {

        try {

            let typeList = siteFunc.emailTypeKey();
            ctx.helper.renderSuccess(ctx, {
                data: typeList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async getOne(ctx) {

        try {
            let type = ctx.query.type;

            let targetItem = await ctx.service.mailTemplate.item(ctx, {
                query: {
                    type: type
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

    async sendEmail(ctx, app) {

        try {
            let fields = ctx.request.body || {};

            let tempkey = fields.tempkey;
            let sendEmailInfo = fields.info;

            let emailTitle = "Hello";
            let emailSubject = "Hello";
            let emailContent = "Hello";
            let toEmail, sysConfigs;

            const systemConfigs = await ctx.service.systemConfig.find({
                isPaging: '0'
            });

            if (_.isEmpty(systemConfigs)) {
                throw new Error(ctx.__('validate_error_params'));
            } else {
                sysConfigs = systemConfigs[0];
            }

            let {
                siteName,
                siteDomain
            } = sysConfigs;

            Object.assign(sendEmailInfo, {
                siteName
            }, {
                siteDomain
            })

            // let myTemp = await ctx.helper.reqJsonData('mailTemplate/getOne', {
            //     type: tempkey
            // });

            let myTemp = await ctx.service.mailTemplate.item(ctx, {
                query: {
                    type: tempkey
                }
            });

            if (_.isEmpty(myTemp) && tempkey != "-1") {
                throw new Error(ctx.__('validate_error_params'));
            }

            emailSubject = emailTitle = '[' + siteName + '] ' + myTemp.title;

            // -1特指邮件群发
            if (tempkey == "-1") {
                emailSubject = emailTitle = '[' + siteName + '] ' + sendEmailInfo.title;
                emailContent = sendEmailInfo.content;
                toEmail = sendEmailInfo.targets;
            } else if (tempkey == "0") {
                toEmail = sendEmailInfo.email;
                let oldLink = sendEmailInfo.password + '$' + sendEmailInfo.email + '$' + app.config.session_secret;
                let newLink = ctx.helper.encrypt(oldLink, app.config.encrypt_key);
                sendEmailInfo.token = newLink;
                emailContent = siteFunc.renderHtmlByKey(myTemp.content, sendEmailInfo, "email,userName,token,siteName,siteDomain");
            } else if (tempkey == "6") {
                var msgDate = moment(sendEmailInfo.date).format('YYYY-MM-DD HH:mm:ss');
                sendEmailInfo.message_author_userName = sendEmailInfo.author.userName;
                sendEmailInfo.message_sendDate = msgDate;
                sendEmailInfo.message_content_title = sendEmailInfo.content.title;
                sendEmailInfo.message_content_id = sendEmailInfo.content._id;
                emailContent = siteFunc.renderHtmlByKey(myTemp.content, sendEmailInfo, 'siteName,message_author_userName,message_sendDate,siteName,siteDomain,message_content_title,message_content_id');
                toEmail = sendEmailInfo.replyAuthor.email;
            } else if (tempkey == "8") {
                emailContent = siteFunc.renderHtmlByKey(myTemp.content, sendEmailInfo, 'email,siteName,siteDomain,msgCode');
                toEmail = sendEmailInfo.email;
            }

            // 发送邮件
            let transporter = nodemailer.createTransport({

                service: sysConfigs.siteEmailServer,
                auth: {
                    user: sysConfigs.siteEmail,
                    pass: ctx.helper.decrypt(sysConfigs.siteEmailPwd, app.config.encrypt_key)
                }

            });

            let mailOptions = {
                from: sysConfigs.siteEmail, // sender address
                to: toEmail, // list of receivers
                subject: emailSubject, // Subject line
                text: emailTitle, // plaintext body
                html: emailContent // html body
            };

            let doSend = () => {
                return new Promise((reslove, reject) => {
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log('邮件发送失败：' + error);
                            reslove('邮件发送失败');
                        } else {
                            console.log('Message sent: ' + info.response);
                            reslove();
                        }
                    });
                })
            }

            await doSend();

            ctx.helper.renderSuccess(ctx, {
                data: {}
            });

        } catch (error) {
            ctx.helper.renderFail(ctx, {
                message: error
            });
        }

    },

}

module.exports = MailTemplateController;