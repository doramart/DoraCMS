/*
 * @Author: doramart
 * @Date: 2019-06-20 18:55:40
 * @Last Modified by: doramart
 * @Last Modified time: 2025-11-22 13:55:28
 */

'use strict';
const Controller = require('egg').Controller;
// const CryptoJS = require('crypto-js');
const { systemConfigRule } = require('../../validate');
// const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const _ = require('lodash');

class SystemConfigController extends Controller {
  async list() {
    const { ctx } = this;
    const payload = ctx.query;

    // 🔥 标准化参数格式
    const options = {
      // 排除密码字段的值，提升安全性
      filters: {
        // 如果需要排除密码类型，可以取消注释
        // type: { $ne: 'password' }
      },
      // fields: ['id', 'key', 'type', 'public', 'createdAt', 'updatedAt'], // 排除敏感的value字段
      sort: [
        { field: 'createdAt', order: 'desc' },
        { field: 'key', order: 'asc' },
      ],
    };

    const systemConfigList = await ctx.service.systemConfig.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: systemConfigList,
    });
  }

  async getOne() {
    const { ctx } = this;
    const id = ctx.query.id;
    // const key = ctx.query.key;

    // 🔥 使用标准化的 findOne 方法替代 item 方法
    const targetConfig = await ctx.service.systemConfig.findOne(
      { id: { $eq: id } }, // 标准化查询条件格式
      {} // 查询选项
    );

    ctx.helper.renderSuccess(ctx, {
      data: targetConfig,
    });
  }

  async update() {
    const { ctx } = this;
    const fields = ctx.request.body || {};

    // 参数验证
    if (fields.id) {
      ctx.validate(systemConfigRule.update(ctx), fields);
    } else {
      ctx.validate(systemConfigRule.form(ctx), fields);
    }

    const { key, value, type, public: isPublic, id } = fields;

    // 🔥 业务验证 - Repository会自动抛出具体异常
    await ctx.service.systemConfig.validateConfigType(type);
    await ctx.service.systemConfig.validateValueType(type, value);

    // 特殊验证：密码类型
    if (type === 'password') {
      await ctx.service.systemConfig.validatePasswordValue(value);
    }

    const formObj = {
      key,
      value,
      type,
      public: isPublic,
    };

    let logAction = 'update';
    let oldData = null;

    if (id) {
      // 获取更新前的数据
      oldData = await ctx.service.systemConfig.findById(id);

      // 更新现有配置
      await ctx.service.systemConfig.update(id, formObj);
      logAction = 'update';
    } else {
      // 创建新配置 - 检查键唯一性
      await ctx.service.systemConfig.checkKeyUnique(key);
      await ctx.service.systemConfig.create(formObj);
      logAction = 'create';
    }

    // 记录操作日志（系统配置修改是高敏感操作）
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'system_config',
        action: logAction,
        resource_type: 'system_config',
        resource_id: id || key,
        old_value: oldData
          ? JSON.stringify({
              key: oldData.key,
              value: type === 'password' ? '******' : oldData.value,
              type: oldData.type,
              public: oldData.public,
            })
          : null,
        new_value: JSON.stringify({
          key: formObj.key,
          value: type === 'password' ? '******' : formObj.value,
          type: formObj.type,
          public: formObj.public,
        }),
        logs: `${logAction === 'create' ? '创建' : '更新'}系统配置: ${key}`,
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    // 更新全局上下文
    ctx.helper.updateAppGlobalContext(this.app, {
      type: 'site',
      data: { [formObj.key]: formObj.value },
    });

    ctx.helper.renderSuccess(ctx);
  }

  /**
   * 删除系统配置 - 支持 RESTful 路由
   * DELETE /api/manage/systemConfig/:id 或 DELETE /api/manage/systemConfig/removes
   */
  async removes() {
    const { ctx } = this;

    // 🔥 支持 RESTful 路由参数
    let idsArray;
    if (ctx.params.id) {
      idsArray = [ctx.params.id];
    } else {
      // 🔥 使用统一的参数处理工具
      const result = DeleteParamsHelper.processDeleteParams(ctx, {
        fieldName: ctx.__('systemConfig.fields.key'),
      });
      idsArray = result.idsArray;
    }

    // 参数验证
    // ctx.validate(systemConfigRule.removes, { ids: idsArray });

    // 获取删除前的数据（用于日志记录）
    const deletedConfigs = await Promise.all(
      idsArray.map(id => ctx.service.systemConfig.findById(id).catch(() => null))
    );

    // 删除配置
    await ctx.service.systemConfig.remove(idsArray, 'id');

    // 记录操作日志（系统配置删除是高敏感操作）
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'system_config',
        action: 'delete',
        resource_type: 'system_config',
        resource_id: idsArray.join(','),
        old_value: JSON.stringify(
          deletedConfigs
            .filter(c => c)
            .map(c => ({
              id: c.id,
              key: c.key,
              type: c.type,
            }))
        ),
        logs: `删除系统配置: ${deletedConfigs
          .filter(c => c)
          .map(c => c.key)
          .join(', ')}`,
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    ctx.helper.renderSuccess(ctx);
  }

  cancelBakDataTask() {
    if (!_.isEmpty(global.bakDataTask)) {
      global.bakDataTask.cancel();
    }
  }
}

module.exports = SystemConfigController;
