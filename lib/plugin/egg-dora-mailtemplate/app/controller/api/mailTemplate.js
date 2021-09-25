'use strict';
const xss = require('xss');
const _ = require('lodash');
const { siteFunc } = require('../../utils');
// 邮件发送插件
const nodemailer = require('nodemailer');
const moment = require('moment');

const MailTemplateController = {
  async list(ctx) {
    try {
      const payload = ctx.query;
      const queryObj = {};

      const mailTemplateList = await ctx.service.mailTemplate.find(payload, {
        query: queryObj,
        searchKeys: ['comment', 'title', 'subTitle'],
      });

      ctx.helper.renderSuccess(ctx, {
        data: mailTemplateList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async typelist(ctx) {
    try {
      const typeList = siteFunc.emailTypeKey();
      ctx.helper.renderSuccess(ctx, {
        data: typeList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx) {
    try {
      const type = ctx.query.type;

      const targetItem = await ctx.service.mailTemplate.item(ctx, {
        query: {
          type,
        },
      });

      ctx.helper.renderSuccess(ctx, {
        data: targetItem,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async sendEmail(ctx, app) {
    try {
      const fields = ctx.request.body || {};

      const tempkey = fields.tempkey;
      const sendEmailInfo = fields.info;

      let emailTitle = 'Hello';
      let emailSubject = 'Hello';
      let emailContent = 'Hello';
      let toEmail, sysConfigs;

      const systemConfigs = await ctx.service.systemConfig.find({
        isPaging: '0',
      });

      if (_.isEmpty(systemConfigs)) {
        throw new Error(ctx.__('validate_error_params'));
      } else {
        sysConfigs = systemConfigs[0];
      }

      const { siteName, siteDomain } = sysConfigs;

      Object.assign(
        sendEmailInfo,
        {
          siteName,
        },
        {
          siteDomain,
        }
      );

      // let myTemp = await ctx.helper.reqJsonData('mailTemplate/getOne', {
      //     type: tempkey
      // });

      const myTemp = await ctx.service.mailTemplate.item(ctx, {
        query: {
          type: tempkey,
        },
      });

      if (_.isEmpty(myTemp)) {
        if (tempkey !== '-1') {
          throw new Error(ctx.__('validate_error_params'));
        }
      } else {
        emailSubject = emailTitle = '[' + siteName + '] ' + myTemp.title;
      }

      // -1特指邮件群发
      if (tempkey === '-1') {
        emailSubject = emailTitle = '[' + siteName + '] ' + sendEmailInfo.title;
        emailContent = sendEmailInfo.content;
        toEmail = sendEmailInfo.targets;
      } else if (tempkey === '0') {
        toEmail = sendEmailInfo.email;
        const oldLink =
          sendEmailInfo.password +
          '$' +
          sendEmailInfo.email +
          '$' +
          app.config.session_secret;
        const newLink = ctx.helper.encrypt(oldLink, app.config.encrypt_key);
        sendEmailInfo.token = encodeURIComponent(newLink);
        emailContent = siteFunc.renderHtmlByKey(
          myTemp.content,
          sendEmailInfo,
          'email,userName,token,siteName,siteDomain'
        );
      } else if (tempkey === '6') {
        const msgDate = moment(sendEmailInfo.date).format(
          'YYYY-MM-DD HH:mm:ss'
        );
        sendEmailInfo.message_author_userName = sendEmailInfo.author.userName;
        sendEmailInfo.message_sendDate = msgDate;
        sendEmailInfo.message_content_title = sendEmailInfo.content.title;
        sendEmailInfo.message_content_id = sendEmailInfo.content._id;
        emailContent = siteFunc.renderHtmlByKey(
          myTemp.content,
          sendEmailInfo,
          'siteName,message_author_userName,message_sendDate,siteName,siteDomain,message_content_title,message_content_id'
        );
        toEmail = sendEmailInfo.replyAuthor.email;
      } else if (tempkey === '8') {
        emailContent = siteFunc.renderHtmlByKey(
          myTemp.content,
          sendEmailInfo,
          'email,siteName,siteDomain,msgCode'
        );
        toEmail = sendEmailInfo.email;
      }

      if (!sysConfigs.siteEmailServer) {
        throw new Error('请先在系统配置中配置邮箱信息！');
      }

      // 发送邮件
      let defaultConfig = {
        service: sysConfigs.siteEmailServer,
        auth: {
          user: sysConfigs.siteEmail,
          pass: ctx.helper.decrypt(
            sysConfigs.siteEmailPwd,
            app.config.encrypt_key
          ),
        },
      };
      if (sysConfigs.siteEmailServer.indexOf('smtp.') === 0) {
        defaultConfig = {
          host: sysConfigs.siteEmailServer,
          port: 465,
          auth: {
            user: sysConfigs.siteEmail,
            pass: ctx.helper.decrypt(
              sysConfigs.siteEmailPwd,
              app.config.encrypt_key
            ),
          },
        };
      }

      const transporter = nodemailer.createTransport(defaultConfig);

      const mailOptions = {
        from: sysConfigs.siteEmail, // sender address
        to: toEmail, // list of receivers
        subject: emailSubject, // Subject line
        text: emailTitle, // plaintext body
        html: emailContent, // html body
      };

      const doSend = () => {
        return new Promise((reslove, reject) => {
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('邮件发送失败：' + error);
              reslove('0');
            } else {
              console.log('Message sent: ' + info.response);
              reslove('1');
            }
          });
        });
      };

      const sendResult = await doSend();

      ctx.helper.renderSuccess(ctx, {
        data: sendResult,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, {
        message: error,
      });
    }
  },
};

module.exports = MailTemplateController;
