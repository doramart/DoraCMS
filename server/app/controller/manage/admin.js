const Controller = require('egg').Controller;
const { adminRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
// const _ = require('lodash');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');
const SYSTEM_CONSTANTS = require('../../constants/SystemConstants');
class AdminController extends Controller {
  async getList() {
    const { ctx, service } = this;

    const payload = ctx.query;
    const query = {};

    // 构建查询条件
    if (payload.userName) {
      query.userName = { $regex: payload.userName, $options: 'i' };
    }
    if (payload.userPhone) {
      query.userPhone = { $regex: payload.userPhone, $options: 'i' };
    }
    if (payload.userEmail) {
      query.userEmail = { $regex: payload.userEmail, $options: 'i' };
    }
    if (payload.status) {
      query.status = payload.status;
    }
    if (payload.nickName) {
      query.nickName = { $regex: payload.nickName, $options: 'i' };
    }
    if (payload.userGender) {
      query.userGender = payload.userGender;
    }

    // 构建查询选项
    const options = {
      filters: query,
      fields: '-password', // 排除密码字段
      populate: ['userRoles'],
    };

    const result = await service.admin.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  async addOne() {
    const { ctx, service } = this;

    const { userName, userPhone, userEmail } = ctx.request.body;

    // 参数验证
    ctx.validate(adminRule.addOne(ctx), ctx.request.body);

    // 业务验证 - 现在会抛出具体的异常，由统一错误处理中间件处理
    await service.admin.checkUserNameUnique(userName);
    await service.admin.checkPhoneUnique(userPhone);
    await service.admin.checkEmailUnique(userEmail);

    // 创建用户
    const result = await service.admin.create(ctx.request.body);

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'admin',
        action: 'create',
        resource_type: 'admin_user',
        resource_id: result.id,
        new_value: JSON.stringify({
          userName: result.userName,
          userEmail: result.userEmail,
          userPhone: result.userPhone,
        }),
        logs: ctx.__('logs.admin.create', [userName]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    await ctx.helper.invalidateAdminPowerCacheByAdminIds(ctx, [result.id]);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 更新管理员信息 - 支持 RESTful 路由
   * PUT /api/manage/admin/:id 或 PUT /api/manage/admin/updateOne
   */
  async updateOne() {
    const { ctx, service } = this;

    // 🔥 支持 RESTful 路由参数
    const id = ctx.params.id || ctx.request.body.id;
    const { userName, userPhone, userEmail } = ctx.request.body;
    ctx.request.body.id = id;

    // 参数验证
    ctx.validate(adminRule.updateOne(ctx), ctx.request.body);

    // 获取更新前的数据（用于日志记录）
    const oldData = await service.admin.findById(id);

    // 业务验证 - 排除当前用户
    await service.admin.checkUserNameUnique(userName, id);
    await service.admin.checkPhoneUnique(userPhone, id);
    await service.admin.checkEmailUnique(userEmail, id);

    // 更新用户
    const result = await service.admin.update(id, ctx.request.body);

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'admin',
        action: 'update',
        resource_type: 'admin_user',
        resource_id: id,
        old_value: JSON.stringify({
          userName: oldData.userName,
          userEmail: oldData.userEmail,
          userPhone: oldData.userPhone,
          status: oldData.status,
        }),
        new_value: JSON.stringify({
          userName: result.userName,
          userEmail: result.userEmail,
          userPhone: result.userPhone,
          status: result.status,
        }),
        logs: ctx.__('logs.admin.update', [userName]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    await ctx.helper.invalidateAdminPowerCacheByAdminIds(ctx, [id]);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 删除管理员 - 支持 RESTful 路由
   * DELETE /api/manage/admin/:id 或 DELETE /api/manage/admin/deleteUser
   */
  async deleteUser() {
    const { ctx, service } = this;

    // 🔥 支持 RESTful 路由参数
    let idsArray;
    if (ctx.params.id) {
      idsArray = [ctx.params.id];
    } else {
      // 🔥 使用统一的参数处理工具
      const result = DeleteParamsHelper.processDeleteParams(ctx, {
        fieldName: ctx.__('admin.fields.userName'),
      });
      idsArray = result.idsArray;
    }

    // 获取删除前的数据（用于日志记录）
    const deletedUsers = await Promise.all(idsArray.map(id => service.admin.findById(id).catch(() => null)));

    const result = await service.admin.remove(idsArray, { cachedAdmins: deletedUsers });

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'admin',
        action: 'delete',
        resource_type: 'admin_user',
        resource_id: idsArray.join(','),
        old_value: JSON.stringify(
          deletedUsers
            .filter(u => u)
            .map(u => ({
              id: u.id,
              userName: u.userName,
            }))
        ),
        logs: ctx.__('logs.admin.delete', [
          deletedUsers
            .filter(u => u)
            .map(u => u.userName)
            .join(', '),
        ]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    await ctx.helper.invalidateAdminPowerCacheByAdminIds(ctx, idsArray);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  async getUserInfo() {
    const { ctx } = this;

    const noticeCounts = 0;
    const userId = ctx.session.adminUserInfo?.id;

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const userInfo = await ctx.service.admin.findOne(
      {
        id: userId,
      },
      {
        populate: [
          {
            path: 'userRoles',
            select: 'menus buttons id status roleName roleCode',
          },
        ],
        fields: ['status', 'id', 'userEmail', 'userName'],
      }
    );

    if (!userInfo) {
      throw RepositoryExceptions.user.notFound(userId);
    }

    // Merge menus and buttons from userRoles
    if (userInfo?.userRoles) {
      const allMenus = [];
      const allButtons = [];
      userInfo.userRoles.forEach(role => {
        if (role.status === '1') {
          // Only include enabled roles
          if (role.menus) {
            allMenus.push(...role.menus);
          }
          if (role.buttons) {
            allButtons.push(...role.buttons);
          }
        }
      });

      // Deduplicate arrays
      userInfo.roles = [...new Set(allMenus)];
      userInfo.buttons = [...new Set(allButtons)];
    }

    const renderData = {
      noticeCounts,
      loginState: true,
      userInfo,
    };

    ctx.helper.renderSuccess(ctx, {
      data: renderData,
    });
  }

  /**
   * 获取用户路由 - 支持 RESTful 路由
   * GET /api/manage/admin/:id/routes 或 GET /api/manage/admin/getUserRoutes
   */
  async getUserRoutes() {
    const { ctx } = this;

    // 🔥 支持 RESTful 路由参数
    const userId = ctx.session.adminUserInfo?.id;
    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const adminUserInfo = await ctx.service.admin.findOne(
      {
        id: userId,
      },
      {
        populate: [
          {
            path: 'userRoles',
            select: 'menus buttons id status roleName roleCode',
          },
        ],
        fields: ['status', 'id', 'userEmail', 'userName'],
      }
    );

    if (!adminUserInfo) {
      throw RepositoryExceptions.user.notFound(userId);
    }

    // Convert to plain object
    const userInfo = adminUserInfo?.toObject ? adminUserInfo.toObject() : adminUserInfo;
    let userMenus = [];

    // Merge menus from userRoles
    if (userInfo?.userRoles) {
      const allMenus = [];
      userInfo.userRoles.forEach(role => {
        if (role.status === '1') {
          // Only include enabled roles
          if (role.menus) {
            allMenus.push(...role.menus);
          }
        }
      });
      userMenus = [...new Set(allMenus)];
    }

    // hideInMenu=1 表示取隐藏页，不走权限过滤；否则仅取显示在菜单里的路由
    const includeHiddenRoutes = ctx.query.hideInMenu === '1';
    const query = {};
    if (!includeHiddenRoutes) {
      query.hideInMenu = false;
    }

    // Get all menus (permission filtering handled later)
    const allMenus = await ctx.service.menu.find(
      {
        isPaging: '0',
        flat: true,
        pageSize: SYSTEM_CONSTANTS.PERMISSION.MAX_PAGE_SIZE,
      },
      Object.keys(query).length ? { query } : {}
    );

    // 如果需要隐藏菜单，收集隐藏菜单及其所有子级，用于过滤
    let allowedMenuIds = userMenus;
    let menuList = allMenus?.data || allMenus?.docs || allMenus;
    if (includeHiddenRoutes) {
      menuList = Array.isArray(menuList) ? menuList : [];
      const hiddenIds = menuList.filter(menu => menu.hideInMenu).map(menu => String(menu.id || menu._id));
      const allowedSet = new Set(hiddenIds);
      const collectChildren = parentId => {
        menuList.forEach(menu => {
          const menuParentId = menu.parentId;
          if (String(menuParentId) === String(parentId)) {
            const mid = String(menu.id || menu._id);
            if (!allowedSet.has(mid)) {
              allowedSet.add(mid);
              collectChildren(mid);
            }
          }
        });
      };
      hiddenIds.forEach(id => collectChildren(id));
      // 向上收集父级，保证树结构连通
      const collectParents = childId => {
        const parentMenu = menuList.find(menu => String(menu.id || menu._id) === String(childId));
        if (parentMenu && parentMenu.parentId && String(parentMenu.parentId) !== '0') {
          const pid = String(parentMenu.parentId);
          if (!allowedSet.has(pid)) {
            allowedSet.add(pid);
            collectParents(pid);
          }
        }
      };
      hiddenIds.forEach(id => collectParents(id));
      allowedMenuIds = Array.from(allowedSet);
    }
    // 确保 ID 对齐为字符串，避免 ObjectId/Number 造成 includes 失败
    const normalizedMenuIds = Array.isArray(allowedMenuIds) ? allowedMenuIds.map(id => String(id)) : [];

    // Build route tree structure using service method
    const sortedRoutes = ctx.service.menu.buildRouteTree(menuList, normalizedMenuIds, {
      includeHiddenRoutes,
    });

    // Sort routes by order
    // const sortRoutes = routes => {
    //   routes.sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0));
    //   routes.forEach(route => {
    //     if (route.children) {
    //       sortRoutes(route.children);
    //     }
    //   });
    //   return routes;
    // };

    // const sortedRoutes = sortRoutes(routes);

    ctx.helper.renderSuccess(ctx, {
      data: includeHiddenRoutes
        ? sortedRoutes
        : {
            routes: sortedRoutes,
            home: 'home', // Default home route
          },
    });
  }

  async logOutAction() {
    const { ctx } = this;

    const userId = ctx.session.adminUserInfo?.id;
    const userName = ctx.session.adminUserInfo?.userName;

    // 记录登出日志（在清除 session 前）
    if (userId) {
      await ctx.service.systemOptionLog
        .logUserLogout({
          id: userId,
          userName,
          type: 'admin',
        })
        .catch(err => {
          console.error('[LogoutLog] Failed to log:', err.message);
        });
    }

    ctx.session = null;
    ctx.cookies.set('admin_' + this.app.config.auth_cookie_name, null);
    ctx.cookies.set('admin_doracmsapi', null);
    ctx.helper.renderSuccess(ctx);
  }
}

module.exports = AdminController;
