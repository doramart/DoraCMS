'use strict';
const _ = require('lodash');
const { uploadFileRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const UploadFileController = {
  /**
   * 获取上传配置列表
   * 🔥 重构优化：移除try-catch，使用统一异常处理中间件
   * @param ctx
   */
  async list(ctx) {
    // 🔥 使用标准化查询参数格式
    const filters = {};

    let uploadFileList = await ctx.service.uploadFile.find({ isPaging: '0' }, { filters });

    if (_.isEmpty(uploadFileList)) {
      uploadFileList = [];
      const configInfo = await ctx.service.uploadFile.create({
        type: 'local',
        uploadPath: process.cwd() + '/app/public',
      });
      uploadFileList.push(configInfo);
    }

    ctx.helper.renderSuccess(ctx, {
      data: uploadFileList[0],
    });
  },

  /**
   * 更新上传配置
   * 🔥 重构优化：标准化参数验证 + 统一异常处理
   * @param ctx
   */
  async update(ctx) {
    const fields = ctx.request.body || {};

    // 🔥 基础参数验证
    if (!fields.id) {
      throw RepositoryExceptions.uploadFile.notFound('missing_id');
    }

    const formObj = {
      type: fields.type,
      updatedAt: new Date(),
    };

    // 参数验证
    ctx.validate(uploadFileRule.form(ctx), formObj);

    // 🔥 检查上传类型唯一性（更新时排除当前记录）
    if (fields.type) {
      await ctx.service.uploadFile.checkTypeUnique(fields.type, fields.id);
    }

    // 根据类型组装配置数据
    if (fields.type === 'local') {
      Object.assign(formObj, {
        uploadPath: fields.uploadPath,
      });
    } else if (fields.type === 'qn') {
      Object.assign(formObj, {
        qn_bucket: fields.qn_bucket,
        qn_accessKey: fields.qn_accessKey,
        qn_secretKey: fields.qn_secretKey,
        qn_zone: fields.qn_zone,
        qn_endPoint: fields.qn_endPoint,
      });
    } else if (fields.type === 'oss') {
      Object.assign(formObj, {
        oss_bucket: fields.oss_bucket,
        oss_accessKey: fields.oss_accessKey,
        oss_secretKey: fields.oss_secretKey,
        oss_region: fields.oss_region,
        oss_endPoint: fields.oss_endPoint,
        oss_apiVersion: fields.oss_apiVersion,
      });
    }

    await ctx.service.uploadFile.update(fields.id, formObj);

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 删除上传配置
   * 🔥 重构优化：移除try-catch，使用统一异常处理中间件
   * @param ctx
   */
  async removes(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('uploadFile.fields.config'),
    });

    await ctx.service.uploadFile.remove(idsArray);
    ctx.helper.renderSuccess(ctx);
  },
};

module.exports = UploadFileController;
