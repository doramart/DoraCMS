'use strict';
const xss = require('xss');
const _ = require('lodash');

const regUserRule = (ctx) => {
  return {
    userName: {
      type: 'string',
      required: true,
      min: 2,
      max: 30,
      message: ctx.__('validate_error_field', [ctx.__('label_user_userName')]),
    },
    email: {
      type: 'email',
      required: true,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_user_email')]),
    },
    phoneNum: {
      type: 'string',
      required: true,
      message: 'invalid phoneNum',
    },
  };
};

const RegUserController = {
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const userlist = await ctx.service.user.find(payload);

      ctx.helper.renderSuccess(ctx, {
        data: userlist,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx, app) {
    try {
      const _id = ctx.query.id;

      const targetUser = await ctx.service.user.item(ctx, {
        query: {
          _id,
        },
      });

      ctx.helper.renderSuccess(ctx, {
        data: targetUser,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async update(ctx, app) {
    try {
      const fields = ctx.request.body || {};

      ctx.validate(regUserRule(ctx), {
        userName: fields.userName,
        email: fields.email,
        phoneNum: fields.phoneNum,
      });

      const userObj = {};

      if (fields.enable !== 'undefined' && fields.enable !== undefined) {
        userObj.enable = fields.enable;
      }
      if (fields.userName) {
        userObj.userName = fields.userName;
      }
      if (fields.phoneNum) {
        userObj.phoneNum = fields.phoneNum;
      }
      if (fields.name) {
        userObj.name = fields.name;
      }
      if (fields.gender) {
        userObj.gender = fields.gender;
      }

      if (fields.logo) {
        userObj.logo = fields.logo;
      }

      if (fields.confirm) {
        userObj.confirm = fields.confirm;
      }
      if (fields.group) {
        userObj.group = fields.group;
      }
      if (fields.category) {
        userObj.category = fields.category;
      }
      if (fields.comments) {
        userObj.comments = xss(fields.comments);
      }
      if (fields.introduction) {
        userObj.introduction = xss(fields.introduction);
      }
      if (fields.company) {
        userObj.company = fields.company;
      }
      if (fields.province) {
        userObj.province = fields.province;
      }
      if (fields.city) {
        userObj.city = fields.city;
      }
      if (fields.birth) {
        // 生日日期不能大于当前时间
        if (new Date(fields.birth).getTime() > new Date().getTime()) {
          throw new Error(ctx.__('validate_error_params'));
        }
        userObj.birth = fields.birth;
      }
      if (fields.industry) {
        userObj.industry = xss(fields.industry);
      }
      if (fields.profession) {
        userObj.profession = xss(fields.profession);
      }
      if (fields.experience) {
        userObj.experience = xss(fields.experience);
      }
      if (fields.password) {
        userObj.password = fields.password;
      }

      // console.log('--userObj--', userObj)
      await ctx.service.user.update(ctx, fields._id, userObj);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async removes(ctx, app) {
    try {
      const targetIds = ctx.query.ids;
      await ctx.service.user.safeDelete(ctx, targetIds);
      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = RegUserController;
