/**
 * 删除操作参数处理工具
 * 🔥 统一处理GET和POST删除请求的参数格式
 * 支持单个删除和批量删除的兼容性处理
 */
'use strict';

const RepositoryExceptions = require('../repository/base/RepositoryExceptions');

class DeleteParamsHelper {
  /**
   * 提取删除操作的目标IDs
   * @param {Object} ctx EggJS上下文对象
   * @param {String} fieldName 字段名称，用于错误提示
   * @return {String} 处理后的目标IDs字符串（逗号分隔）
   * @throws {ValidationError} 当参数无效时抛出异常
   */
  static extractTargetIds(ctx, fieldName = 'id') {
    let targetIds;

    // 优先支持POST请求体参数
    if (ctx.request.body && (ctx.request.body.id || ctx.request.body.ids)) {
      if (ctx.request.body.id) {
        // 单个删除：{ id: "单个ID" }
        targetIds = ctx.request.body.id;
      } else if (ctx.request.body.ids) {
        // 批量删除：{ ids: ["id1", "id2"] } 或 { ids: "id1,id2" }
        targetIds = typeof ctx.request.body.ids === 'string' ? ctx.request.body.ids.split(',') : ctx.request.body.ids;
      }
    } else if (ctx.params && ctx.params.id) {
      // 支持URL参数格式（如 /delete/:id）
      targetIds = ctx.params.id;
    } else {
      // 兼容原有的GET查询参数格式
      targetIds = ctx.query.ids;
    }

    // 参数验证
    if (!targetIds) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.selectNull', [fieldName]));
    }

    return targetIds;
  }

  /**
   * 提取删除操作的目标IDs数组
   * @param {Object} ctx EggJS上下文对象
   * @param {String} fieldName 字段名称，用于错误提示
   * @return {Array} 处理后的目标IDs数组
   * @throws {ValidationError} 当参数无效时抛出异常
   */
  static extractTargetIdsArray(ctx, fieldName = 'id') {
    const targetIds = this.extractTargetIds(ctx, fieldName);

    // 转换为数组格式
    const idsArray = targetIds.split(',').filter(id => id.trim());

    // 验证每个ID的格式
    for (const id of idsArray) {
      if (!ctx.validateId || !ctx.validateId(id)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }
    }

    return idsArray;
  }

  /**
   * 提取删除操作的额外参数
   * @param {Object} ctx EggJS上下文对象
   * @param {Array} paramNames 需要提取的参数名称列表
   * @return {Object} 提取的参数对象
   */
  static extractExtraParams(ctx, paramNames = []) {
    const params = {};

    paramNames.forEach(paramName => {
      // 优先从POST请求体获取
      if (ctx.request.body && ctx.request.body[paramName] !== undefined) {
        params[paramName] = ctx.request.body[paramName];
      } else {
        // 兼容GET查询参数
        params[paramName] = ctx.query[paramName];
      }
    });

    return params;
  }

  /**
   * 完整的删除参数处理（包含目标IDs和额外参数）
   * @param {Object} ctx EggJS上下文对象
   * @param {Object} options 选项
   * @param {String} options.fieldName 字段名称，用于错误提示
   * @param {Array} options.extraParams 需要提取的额外参数名称列表
   * @return {Object} 处理结果 { targetIds, idsArray, extraParams }
   */
  static processDeleteParams(ctx, options = {}) {
    const { fieldName = 'id', extraParams = [] } = options;

    const targetIds = this.extractTargetIds(ctx, fieldName);
    // 转换为数组格式
    const idsArray = Array.isArray(targetIds) ? targetIds : [targetIds];
    const extraParamsObj = this.extractExtraParams(ctx, extraParams);

    // 验证每个ID的格式
    for (const id of idsArray) {
      if (!ctx.validateId || !ctx.validateId(id)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }
    }

    return {
      targetIds,
      idsArray,
      extraParams: extraParamsObj,
    };
  }
}

module.exports = DeleteParamsHelper;
