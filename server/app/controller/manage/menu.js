/**
 * Menu Controller - 使用标准化参数的重构版本
 * 基于 Repository 模式和统一异常处理机制 (2024优化版)
 */
'use strict';

const Controller = require('egg').Controller;
const { menuRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const SUPPORTED_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

class MenuController extends Controller {
  normalizeButtons(buttons = []) {
    if (!Array.isArray(buttons)) {
      return [];
    }

    return buttons.map(rawButton => {
      const { code: _legacyCode, ...button } = rawButton || {};
      const desc = button.desc ? String(button.desc).trim() : '';
      const api = button.api ? String(button.api).trim() : '';
      const permissionCode = button.permissionCode ? String(button.permissionCode).trim() : '';
      let httpMethod = (button.httpMethod || button.method || 'POST').toString().toUpperCase();

      if (!SUPPORTED_HTTP_METHODS.includes(httpMethod)) {
        httpMethod = 'POST';
      }

      return {
        ...button,
        desc,
        api,
        permissionCode,
        httpMethod,
      };
    });
  }

  validateButtonSecurity(buttons = []) {
    if (!Array.isArray(buttons) || buttons.length === 0) {
      return;
    }
    const { app } = this;
    const strictBindingEnabled = app.config.permission?.strictMenuBinding !== false;

    const apiPattern = /^[a-zA-Z][a-zA-Z0-9]*\/[a-zA-Z][a-zA-Z0-9]*$/;
    const invalidMethodButtons = buttons.filter(
      button => button.httpMethod && !SUPPORTED_HTTP_METHODS.includes(button.httpMethod)
    );
    if (invalidMethodButtons.length > 0) {
      throw RepositoryExceptions.create.validation(
        this.ctx.__('menu.errors.invalidButtonMethod', [
          invalidMethodButtons.map(btn => btn.permissionCode || btn.desc || 'unknown').join(', '),
        ])
      );
    }

    buttons.forEach(button => {
      if (!button || !button.api) {
        return;
      }
      if (!apiPattern.test(button.api)) {
        throw RepositoryExceptions.create.validation(this.ctx.__('menu.errors.invalidButtonApiFormat', [button.api]));
      }
      if (button.api.length > 100) {
        throw RepositoryExceptions.create.validation(this.ctx.__('menu.errors.buttonApiTooLong', [button.api]));
      }
      if (/[<>\"'&\s]/.test(button.api) || button.api.includes('..') || button.api.includes('//')) {
        throw RepositoryExceptions.create.validation(this.ctx.__('menu.errors.buttonApiInvalidChars', [button.api]));
      }
    });

    if (strictBindingEnabled) {
      const missingPermissionCode = buttons.filter(button => !button.permissionCode);
      if (missingPermissionCode.length > 0) {
        throw RepositoryExceptions.create.validation(
          this.ctx.__('menu.errors.buttonMissingPermission', [
            missingPermissionCode.map(btn => btn.desc || 'unknown').join(', '),
          ])
        );
      }

      if (app.permissionRegistry) {
        const invalidCodes = buttons
          .map(btn => btn.permissionCode)
          .filter(code => code && !app.permissionRegistry.getByCode(code));
        if (invalidCodes.length > 0) {
          throw RepositoryExceptions.create.validation(
            this.ctx.__('menu.errors.permissionNotDeclared', [invalidCodes.join(', ')])
          );
        }
      }
    }
  }

  /**
   * 获取菜单列表 - 统一异常处理版本
   */
  async getList() {
    const { ctx, service } = this;

    const payload = ctx.query;

    // 设置分页参数
    Object.assign(payload, {
      pageSize: 1000,
      lean: '1',
    });

    // 构建标准化查询条件
    const filters = {};

    if (payload.hideInMenu === '0') {
      filters.hideInMenu = { $eq: false };
    }

    // 设置标准化选项
    const options = {
      filters,
      searchKeys: ['menuName', 'routeName', 'routePath', 'i18nKey'],
    };

    const result = await service.menu.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 添加菜单 - 统一异常处理版本
   */
  async addOne() {
    const { ctx, service } = this;

    // 参数验证
    ctx.validate(menuRule.addOne);

    const { routePath, routeName, menuType, parentId, buttons = [] } = ctx.request.body;

    // 🔥 业务验证 - Repository会自动抛出具体异常
    await service.menu.checkRoutePathUnique(routePath);
    await service.menu.checkRouteNameUnique(routeName);
    await service.menu.checkMenuTypeValid(menuType);
    await service.menu.checkParentMenuExists(parentId);

    const normalizedButtons = this.normalizeButtons(buttons);
    const permissionCodes = normalizedButtons.map(btn => btn.permissionCode).filter(code => code);
    if (permissionCodes.length > 0) {
      await service.menu.checkButtonPermissionCodesUnique(permissionCodes);
    }

    this.validateButtonSecurity(normalizedButtons);
    ctx.request.body.buttons = normalizedButtons;

    // 创建菜单
    const result = await service.menu.create(ctx.request.body);

    await ctx.helper.invalidateAllAdminPowerCache(ctx);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 更新菜单 - 支持 RESTful 路由
   * PUT /api/manage/menu/:id 或 PUT /api/manage/menu/updateOne
   */
  async updateOne() {
    const { ctx, service } = this;

    // 参数验证
    ctx.validate(menuRule.updateOne);

    // 🔥 支持 RESTful 路由参数
    const id = ctx.params.id || ctx.request.body.id;
    const { routePath, routeName, menuType, parentId, buttons = [] } = ctx.request.body;
    ctx.request.body.id = id;

    // 🔥 业务验证 - Repository会自动抛出具体异常
    await service.menu.checkRoutePathUnique(routePath, id);
    await service.menu.checkRouteNameUnique(routeName, id);

    if (menuType) {
      await service.menu.checkMenuTypeValid(menuType);
    }

    if (parentId !== undefined) {
      await service.menu.checkParentMenuExists(parentId);
    }

    const normalizedButtons = this.normalizeButtons(buttons);
    const permissionCodes = normalizedButtons.map(btn => btn.permissionCode).filter(code => code);
    if (permissionCodes.length > 0) {
      await service.menu.checkButtonPermissionCodesUnique(permissionCodes, id);
    }

    this.validateButtonSecurity(normalizedButtons);
    ctx.request.body.buttons = normalizedButtons;

    // 更新菜单
    const result = await service.menu.update(id, ctx.request.body);

    await ctx.helper.invalidateAllAdminPowerCache(ctx);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 删除菜单 - 支持 RESTful 路由
   * DELETE /api/manage/menu/:id 或 DELETE /api/manage/menu/deleteMenu
   */
  async deleteMenu() {
    const { ctx, service } = this;

    // 🔥 支持 RESTful 路由参数
    let idsArray;
    if (ctx.params.id) {
      idsArray = [ctx.params.id];
    } else {
      // 🔥 使用统一的参数处理工具
      const result = DeleteParamsHelper.processDeleteParams(ctx, {
        fieldName: ctx.__('menu.fields.name'),
      });
      idsArray = result.idsArray;
    }

    // 获取所有要删除的菜单（包括子菜单）
    const allMenusToDelete = new Set();

    for (const id of idsArray) {
      // 🔥 检查菜单是否存在
      const menu = await service.menu.findById(id);
      if (!menu) {
        throw RepositoryExceptions.resource.notFound(ctx.__('menu.label'), id);
      }

      // 获取菜单及其所有子菜单
      const menuAndChildren = await service.menu.getMenuAndChildren(id);
      if (menuAndChildren?.length > 0) {
        menuAndChildren.forEach(menu => allMenusToDelete.add(menu.id.toString()));
      }
    }

    // 删除所有菜单
    if (allMenusToDelete.size > 0) {
      const result = await service.menu.removes(Array.from(allMenusToDelete));
      await ctx.helper.invalidateAllAdminPowerCache(ctx);
      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } else {
      throw RepositoryExceptions.business.operationNotAllowed(this.ctx.__('menu.errors.noMenuToDelete'));
    }
  }

  /**
   * 更新菜单排序 - 统一异常处理版本
   */
  async updateOrder() {
    const { ctx, service } = this;

    const { id, order } = ctx.request.body;

    // 参数验证
    if (!id || typeof order !== 'number') {
      throw RepositoryExceptions.create.validation('无效的参数：菜单ID和排序值必须提供');
    }

    // 🔥 检查菜单是否存在
    const menu = await service.menu.findById(id);
    if (!menu) {
      throw RepositoryExceptions.resource.notFound('菜单', id);
    }

    const result = await service.menu.updateOrder(id, order);

    await ctx.helper.invalidateAllAdminPowerCache(ctx);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 批量更新菜单状态 - 统一异常处理版本
   */
  async batchUpdateStatus() {
    const { ctx, service } = this;

    const { ids, status } = ctx.request.body;

    // 参数验证
    if (!ids || !ids.length) {
      throw RepositoryExceptions.create.validation('菜单ID列表不能为空');
    }

    if (!['0', '1'].includes(status)) {
      throw RepositoryExceptions.create.validation('状态值必须是 0（禁用）或 1（启用）');
    }

    // 🔥 验证所有菜单是否存在
    for (const id of ids) {
      const menu = await service.menu.findById(id);
      if (!menu) {
        throw RepositoryExceptions.resource.notFound('菜单', id);
      }
    }

    const result = await service.menu.batchUpdateStatus(ids, status);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 获取单个菜单详情 - 统一异常处理版本
   */
  async getOne() {
    const { ctx, service } = this;

    const { id } = ctx.query;

    // 参数验证
    if (!id) {
      throw RepositoryExceptions.create.validation('菜单ID不能为空');
    }

    // 查找菜单
    const result = await service.menu.findById(id);

    if (!result) {
      throw RepositoryExceptions.resource.notFound('菜单', id);
    }

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 根据父级ID获取菜单列表
   */
  async getByParentId() {
    const { ctx, service } = this;
    try {
      const { parentId = '0' } = ctx.query;

      // 使用标准化查询方式
      const options = {
        fields: ['id', 'menuName', 'routeName', 'routePath', 'menuType', 'status', 'order'],
      };

      const result = await service.menu.findByParentId(parentId, options);

      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  }

  /**
   * 根据菜单类型获取菜单列表
   */
  async getByMenuType() {
    const { ctx, service } = this;
    try {
      const { menuType } = ctx.query;

      if (!menuType || !['1', '2'].includes(menuType)) {
        return ctx.helper.renderFail(ctx, {
          message: ctx.__('menu_invalid_params'),
        });
      }

      // 使用标准化查询方式
      const options = {
        filters: {
          status: { $eq: '1' }, // 只查询启用的菜单
        },
        fields: ['id', 'menuName', 'routeName', 'routePath', 'parentId', 'order'],
      };

      const result = await service.menu.findByMenuType(menuType, options);

      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  }

  /**
   * 获取菜单统计信息
   */
  async getStats() {
    const { ctx, service } = this;
    try {
      const result = await service.menu.getMenuStats();

      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  }

  /**
   * 获取菜单路径
   */
  async getMenuPath() {
    const { ctx, service } = this;
    try {
      const { id } = ctx.query;

      if (!id) {
        return ctx.helper.renderFail(ctx, {
          message: ctx.__('menu_invalid_params'),
        });
      }

      const result = await service.menu.getMenuPath(id);

      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  }

  /**
   * 根据按钮权限标识查找菜单
   */
  async getByPermissionCodes() {
    const { ctx, service } = this;
    try {
      const { codes } = ctx.query;

      if (!codes) {
        return ctx.helper.renderFail(ctx, {
          message: ctx.__('menu_invalid_params'),
        });
      }

      const permissionCodes = codes.split(',').filter(code => code.trim());
      if (permissionCodes.length === 0) {
        return ctx.helper.renderFail(ctx, {
          message: ctx.__('menu_invalid_params'),
        });
      }

      const result = await service.menu.findMenusByPermissionCodes(permissionCodes);

      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  }

  /**
   * 获取按钮API列表
   */
  async getButtonApis() {
    const { ctx, service } = this;
    try {
      const { menuIds } = ctx.query;

      let menuIdArray = [];
      if (menuIds) {
        menuIdArray = menuIds.split(',').filter(id => id.trim());
      }

      const result = await service.menu.getButtonApis(menuIdArray);

      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  }
}

module.exports = MenuController;
