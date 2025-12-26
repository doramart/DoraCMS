const Controller = require('egg').Controller;
const { roleRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

class RoleController extends Controller {
  async normalizeRoleButtons(buttons = [], menuIds = []) {
    const { ctx } = this;
    const strictBindingEnabled = ctx.app.config.permission?.strictMenuBinding !== false;
    const buttonCodes = Array.isArray(buttons) ? buttons.filter(Boolean) : [];

    if (buttonCodes.length === 0) {
      return [];
    }

    const targetMenuIds = Array.isArray(menuIds) ? menuIds : [];
    const menuButtonList = await ctx.service.menu.getMenuButtonsWithPermissionCodes(targetMenuIds);

    const buttonMap = new Map();
    menuButtonList.forEach(btn => {
      if (btn.permissionCode) {
        buttonMap.set(btn.permissionCode, btn);
      }
    });

    const permissionRegistry = ctx.app.permissionRegistry;
    const normalized = [];
    const invalidCodes = [];

    buttonCodes.forEach(code => {
      const button = buttonMap.get(code);
      if (button && button.permissionCode) {
        normalized.push(button.permissionCode);
        return;
      }

      if (permissionRegistry?.getByCode(code)) {
        normalized.push(permissionRegistry.getByCode(code).code);
        return;
      }

      if (!strictBindingEnabled) {
        normalized.push(code);
        return;
      }

      invalidCodes.push(code);
    });

    if (invalidCodes.length > 0) {
      throw RepositoryExceptions.create.validation(ctx.__('role.errors.invalidButtons', [invalidCodes.join(', ')]));
    }

    return [...new Set(normalized)];
  }

  async getList() {
    const { ctx, service } = this;
    const payload = ctx.query;

    // 🔥 标准化查询条件格式（基于Menu模块成功实践）
    const filters = {};
    if (payload.roleName) {
      filters.roleName = { $regex: payload.roleName, $options: 'i' };
    }
    if (payload.roleCode) {
      filters.roleCode = { $regex: payload.roleCode, $options: 'i' };
    }
    if (payload.status) {
      filters.status = { $eq: payload.status };
    }

    // 🔥 使用标准化参数格式
    const options = {
      filters,
      searchKeys: ['roleName', 'roleCode', 'roleDesc'],
      fields: ['id', 'roleName', 'roleCode', 'roleDesc', 'status', 'menus', 'buttons', 'createdAt', 'updatedAt'],
      sort: [{ field: 'createdAt', order: 'desc' }],
    };

    const result = await service.role.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  async getAllList() {
    const { ctx, service } = this;
    const payload = { ...ctx.query, isPaging: '0' };

    // 🔥 标准化参数格式
    const options = {
      filters: {},
      fields: ['id', 'roleName', 'roleCode', 'roleDesc', 'status', 'menus', 'buttons'],
      sort: [{ field: 'createdAt', order: 'asc' }],
    };

    const result = await service.role.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  async addOne() {
    const { ctx, service } = this;

    // 参数验证
    ctx.validate(roleRule.addOne);

    const { roleCode, roleName, menus = [], buttons = [] } = ctx.request.body;

    // 🔥 业务验证 - Repository会自动抛出具体异常
    await service.role.checkRoleCodeUnique(roleCode);
    await service.role.checkRoleNameUnique(roleName);

    ctx.request.body.buttons = await this.normalizeRoleButtons(buttons, menus);

    // 创建角色
    const result = await service.role.create(ctx.request.body);

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'role',
        action: 'create',
        resource_type: 'role',
        resource_id: result.id,
        new_value: JSON.stringify({
          roleName: result.roleName,
          roleCode: result.roleCode,
          menus: result.menus,
          buttons: result.buttons,
        }),
        logs: ctx.__('logs.role.create', [roleName]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 更新角色 - 支持 RESTful 路由
   * PUT /api/manage/role/:id 或 PUT /api/manage/role/updateOne
   */
  async updateOne() {
    const { ctx, service } = this;

    // 参数验证
    ctx.validate(roleRule.updateOne);

    // 🔥 支持 RESTful 路由参数
    const id = ctx.params.id || ctx.request.body.id;
    const { roleCode, roleName, menus = [], buttons = [] } = ctx.request.body;
    ctx.request.body.id = id;

    // 获取更新前的数据（用于日志记录）
    const oldData = await service.role.findById(id);

    // 🔥 业务验证 - Repository会自动抛出具体异常
    await service.role.checkRoleCodeUnique(roleCode, id);
    if (roleName) {
      await service.role.checkRoleNameUnique(roleName, id);
    }

    ctx.request.body.buttons = await this.normalizeRoleButtons(buttons, menus);

    // 更新角色
    const result = await service.role.update(id, ctx.request.body);

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'role',
        action: 'update',
        resource_type: 'role',
        resource_id: id,
        old_value: JSON.stringify({
          roleName: oldData.roleName,
          roleCode: oldData.roleCode,
          menus: oldData.menus,
          buttons: oldData.buttons,
          status: oldData.status,
        }),
        new_value: JSON.stringify({
          roleName: result.roleName,
          roleCode: result.roleCode,
          menus: result.menus,
          buttons: result.buttons,
          status: result.status,
        }),
        logs: ctx.__('logs.role.update', [roleName]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    await ctx.helper.invalidateAdminPowerCacheByRoleIds(ctx, [id]);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 删除角色 - 支持 RESTful 路由
   * DELETE /api/manage/role/:id 或 DELETE /api/manage/role/deleteRole
   */
  async deleteRole() {
    const { ctx, service } = this;

    // 🔥 支持 RESTful 路由参数
    let idsArray;
    if (ctx.params.id) {
      idsArray = [ctx.params.id];
    } else {
      // 🔥 使用统一的参数处理工具
      const result = DeleteParamsHelper.processDeleteParams(ctx, {
        fieldName: ctx.__('role.fields.roleName'),
      });
      idsArray = result.idsArray;
    }

    // 获取删除前的数据（用于日志记录）
    const deletedRoles = await Promise.all(idsArray.map(id => service.role.findById(id).catch(() => null)));

    await ctx.helper.invalidateAdminPowerCacheByRoleIds(ctx, idsArray);

    // 删除角色
    const result = await service.role.removes(idsArray);

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'role',
        action: 'delete',
        resource_type: 'role',
        resource_id: idsArray.join(','),
        old_value: JSON.stringify(
          deletedRoles
            .filter(r => r)
            .map(r => ({
              id: r.id,
              roleName: r.roleName,
              roleCode: r.roleCode,
            }))
        ),
        logs: ctx.__('logs.role.delete', [
          deletedRoles
            .filter(r => r)
            .map(r => r.roleName)
            .join(', '),
        ]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }
}

module.exports = RoleController;
