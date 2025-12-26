'use strict';
const xss = require('xss');
const { regUserRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const RegUserController = {
  async list(ctx) {
    const payload = ctx.query;

    // 🔥 标准化查询条件 - 使用操作符格式
    const filters = { state: '1' };
    if (payload.userName) {
      filters.userName = { $regex: payload.userName, $options: 'i' };
    }
    if (payload.email) {
      filters.email = { $regex: payload.email, $options: 'i' };
    }
    if (payload.phoneNum) {
      filters.phoneNum = { $eq: payload.phoneNum };
    }
    if (payload.enable) {
      filters.enable = { $eq: payload.enable === '1' };
    }

    // 🔥 标准化查询选项
    const options = {
      filters,
      fields: ['id', 'userName', 'name', 'email', 'phoneNum', 'enable', 'group', 'createdAt', 'logo', 'state'],
      sort: [{ field: 'createdAt', order: 'desc' }],
    };

    const userlist = await ctx.service.user.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: userlist,
    });
  },

  /**
   * 获取单个用户信息 - 支持 RESTful 路由
   * GET /api/manage/regUser/:id 或 GET /api/manage/regUser/getOne?id=xxx
   * @param ctx
   */
  async getOne(ctx) {
    const id = ctx.params.id || ctx.query.id;

    // 🔥 参数验证
    if (!id) {
      throw RepositoryExceptions.business.invalidParams('用户ID不能为空');
    }

    // 🔥 标准化查询条件和选项
    const filters = { id: { $eq: id } };
    const options = {
      fields: [
        'id',
        'userName',
        'name',
        'email',
        'phoneNum',
        'enable',
        'group',
        'gender',
        'logo',
        'province',
        'city',
        'birth',
        'introduction',
        'company',
        'createdAt',
        'updatedAt',
      ],
    };

    const targetUser = await ctx.service.user.findOne(filters, options);

    if (!targetUser) {
      throw RepositoryExceptions.user.notFound(id);
    }

    ctx.helper.renderSuccess(ctx, {
      data: targetUser,
    });
  },

  /**
   * 更新用户信息 - 支持 RESTful 路由
   * PUT /api/manage/regUser/:id 或 PUT /api/manage/regUser/update
   * @param ctx
   */
  async update(ctx) {
    const fields = ctx.request.body || {};

    // 🔥 支持 RESTful 路由参数
    const id = ctx.params.id || fields.id;
    fields.id = id;

    // 🔥 参数验证
    if (!id) {
      throw RepositoryExceptions.business.invalidParams('用户ID不能为空');
    }

    ctx.validate(regUserRule.form(ctx), {
      userName: fields.userName,
      email: fields.email,
      phoneNum: fields.phoneNum,
    });

    // 🔥 业务验证 - 使用Repository的统一异常处理版本
    if (fields.userName) {
      await ctx.service.user.checkUserNameUnique(fields.userName, id);
    }
    if (fields.email) {
      await ctx.service.user.checkEmailUnique(fields.email, id);
    }
    if (fields.phoneNum) {
      await ctx.service.user.checkPhoneUnique(fields.phoneNum, id);
    }

    // 🔥 构建更新数据对象
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
      // 🔥 生日验证 - 使用语义化异常
      if (new Date(fields.birth).getTime() > new Date().getTime()) {
        throw RepositoryExceptions.business.invalidParams('出生日期不能大于当前时间');
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

    await ctx.service.user.update(id, userObj);

    ctx.helper.renderSuccess(ctx);
  },

  async removes(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('user.fields.userName'),
    });

    // 🔥 批量软删除用户
    await ctx.service.user.safeDelete(idsArray, { state: '0' });

    ctx.helper.renderSuccess(ctx);
  },
};

module.exports = RegUserController;
