'use strict';
const xss = require('xss');
const _ = require('lodash');
const schedule = require('node-schedule');

const mailDeliveryRule = (ctx) => {
  return {
    emailType: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('邮件类型')]),
    },

    timing: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('定时')]),
    },

    comments: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('备注')]),
    },

    type: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('任务类型')]),
    },
  };
};

const sendEmailByTask = async (ctx, taskId, emailInfo, targetUserInfo) => {
  try {
    const { allEmailArr, allUserIdArr } = targetUserInfo;

    for (let j = 0; j < allEmailArr.length; j++) {
      const emailArr = allEmailArr[j];
      const sendEmailDo = () => {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            const sendResult = await ctx.helper.reqJsonData(
              'mailTemplate/sendEmail',
              {
                tempkey: '-1', // -1特指邮件群发
                info: {
                  title: emailInfo.comments,
                  targets: emailArr.join(','),
                  content: emailInfo.content,
                },
              },
              'post'
            );

            await ctx.service.sendLog.create({
              taskId,
              recipient: allUserIdArr[j],
              recipientEmail: emailArr,
              state: sendResult,
              createTime: new Date(),
            });

            resolve();
          }, 1500);
        });
      };
      await sendEmailDo();
    }
  } catch (error) {
    await ctx.service.mailDelivery.update(ctx, taskId, {
      state: '1',
    });
    await ctx.service.sendLog.create({
      taskId,
      recipient: targetUser._id,
      recipientEmail: targetUser.email,
      state: '0',
      createTime: new Date(),
    });
  }
};

const sendMailByTimingTask = async (ctx, taskId, emailInfo, sendUserInfo) => {
  if (!_.isEmpty(global['sendMailTimingTask_' + taskId])) {
    global['sendMailTimingTask_' + taskId].cancel();
  }

  global['sendMailTimingTask_' + taskId] = schedule.scheduleJob(
    emailInfo.timing,
    async function () {
      if (!_.isEmpty(sendUserInfo)) {
        sendEmailByTask(ctx, taskId, emailInfo, sendUserInfo);
      }
    }
  );
};

// 群发用户邮箱集合
const getSendUserInfo = async (ctx, targetType, targetUsers = []) => {
  const skipCount = 20; // 设定批量发送最小单位
  let allUserCount,
    queryObj = {};
  if (targetType === '0') {
    allUserCount = await ctx.service.user.count();
  } else if (targetType === '1') {
    allUserCount = targetUsers.length;
    queryObj = {
      _id: {
        $in: targetUsers,
      },
    };
  }

  const sendNum = Math.ceil(allUserCount / skipCount);
  const allUserIdArr = [];
  const allEmailArr = [];
  for (let i = 0; i < sendNum; i++) {
    const unitUser = await ctx.service.user.find(
      {
        isPaging: '0',
        current: i,
        pageSize: skipCount,
      },
      {
        query: queryObj,
        files: 'email',
      }
    );

    if (!_.isEmpty(unitUser)) {
      const unitEmails = unitUser.map((item) => {
        return item.email;
      });
      const unitIds = unitUser.map((item) => {
        return item._id;
      });
      allEmailArr.push(unitEmails);
      allUserIdArr.push(unitIds);
    }
  }

  return {
    allEmailArr,
    allUserIdArr,
  };
};
const doSendEmailTask = async (ctx, fields, taskId) => {
  try {
    const targetUsers = fields.targets;
    const sendUserInfo = await getSendUserInfo(
      ctx,
      fields.targetType,
      targetUsers
    );

    if (fields.type === '0') {
      // 立即发送

      if (!_.isEmpty(sendUserInfo)) {
        sendEmailByTask(ctx, taskId, fields, sendUserInfo);
      }

      // 更新发送状态
      await ctx.service.mailDelivery.update(ctx, taskId, {
        state: '2',
      });
    } else if (fields.type === '1') {
      // 定时发送
      if (!fields.timing) {
        fields.timing = new Date();
      }

      if (!_.isEmpty(sendUserInfo)) {
        sendMailByTimingTask(ctx, taskId, fields, sendUserInfo);
      }

      await ctx.service.mailDelivery.update(ctx, taskId, {
        state: '2',
      });
    }
  } catch (error) {
    console.log('email send error', error);
  }
};

const MailDeliveryController = {
  async list(ctx) {
    try {
      const payload = ctx.query;
      const queryObj = {};

      const mailDeliveryList = await ctx.service.mailDelivery.find(payload, {
        query: queryObj,
        populate: ['sender', 'emailType'],
        sort: {
          createTime: -1,
        },
      });

      ctx.helper.renderSuccess(ctx, {
        data: mailDeliveryList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async sendloglist(ctx) {
    try {
      const payload = ctx.query;
      const queryObj = {
        taskId: payload.taskId,
      };

      const sendLogList = await ctx.service.sendLog.find(payload, {
        query: queryObj,
        populate: ['recipient'],
        sort: {
          createTime: -1,
        },
      });

      ctx.helper.renderSuccess(ctx, {
        data: sendLogList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async create(ctx) {
    try {
      const fields = ctx.request.body || {};
      let sendMailTask;
      const formObj = {
        sender: ctx.session.adminUserInfo._id,
        emailType: fields.emailType,
        state: '0',
        timing: fields.timing,
        comments: fields.comments,
        content: fields.content,
        type: fields.type,
        targets: fields.targets,
        targetType: fields.targetType,
        createTime: new Date(),
      };

      ctx.validate(mailDeliveryRule(ctx), formObj);

      sendMailTask = await ctx.service.mailDelivery.create(formObj);

      doSendEmailTask(ctx, fields, sendMailTask._id);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx) {
    try {
      const _id = ctx.query.id;

      const targetItem = await ctx.service.mailDelivery.item(ctx, {
        query: {
          _id,
        },
        populate: ['targets'],
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

  async update(ctx) {
    try {
      const fields = ctx.request.body || {};
      const formObj = {
        sender: ctx.session.adminUserInfo._id,
        emailType: fields.emailType,
        timing: fields.timing,
        comments: fields.comments,
        content: fields.content,
        type: fields.type,
        targets: fields.targets,
        targetType: fields.targetType,
        updateTime: new Date(),
      };

      ctx.validate(mailDeliveryRule(ctx), formObj);

      await ctx.service.mailDelivery.update(ctx, fields._id, formObj);

      doSendEmailTask(ctx, fields, fields._id);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async removes(ctx) {
    try {
      const targetIds = ctx.query.ids;
      await ctx.service.mailDelivery.removes(ctx, targetIds);

      // 删除与该任务相关的发送记录
      await ctx.service.sendLog.removes(ctx, targetIds, 'taskId');

      if (!_.isEmpty(global['sendMailTimingTask_' + targetIds])) {
        global['sendMailTimingTask_' + targetIds].cancel();
      }

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      xxx;

      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = MailDeliveryController;
