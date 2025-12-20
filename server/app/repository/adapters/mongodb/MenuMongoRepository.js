/**
 * 标准化的 Menu MongoDB Repository
 * 使用统一参数接口的实现
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
// const { UniqueConstraintError, ValidationError } = require('../../../exceptions');
// const _ = require('lodash');

class MenuMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Menu');

    // 设置 MongoDB 模型
    this.model = this.app.model.Menu;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // Menu 暂时没有关联关系，所有数据都是自包含的
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      // Menu 暂时没有关联查询需求
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['menuName', 'routeName', 'routePath', 'i18nKey'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'order', order: 'asc' },
      { field: 'createdAt', order: 'desc' },
    ];
  }

  /**
   * 查找菜单列表（支持树形结构）
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async find(payload = {}, options = {}) {
    try {
      // 调用父类的find方法获取基础结果
      const result = await super.find(payload, options);

      // 如果需要树形结构处理（通过 payload.flat 控制）
      if (!payload.flat && result && result.docs) {
        result.docs = this.buildMenuTree(result.docs);
      } else if (!payload.flat && Array.isArray(result)) {
        // 如果不是分页结果，直接是数组
        return this.buildMenuTree(result);
      }

      return result;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  // 🔥 _transformSortToMongo 已移到基类 BaseStandardRepository

  // 注意：基础CRUD方法(findOne, findById, count, create, update, remove, safeDelete)
  // 已在BaseMongoRepository中实现，此处只保留Menu模块特有的业务方法

  // ===== Menu 特有的业务方法 =====

  /**
   * 检查菜单是否可以删除（无子菜单）- 统一异常处理版本
   * @param {String} menuId 菜单ID
   * @return {Promise<Boolean>} 是否可以删除
   * @throws {BusinessRuleError} 当菜单有子菜单时抛出异常
   */
  async checkMenuCanDelete(menuId) {
    try {
      const children = await this.findByParentId(menuId);
      if (children && children.length > 0) {
        throw this.exceptions.menu.hasChildren(menuId);
      }
      return true;
    } catch (error) {
      if (error.name === 'BusinessRuleError') {
        throw error;
      }
      this._handleError(error, 'checkMenuCanDelete', { menuId });
    }
  }

  /**
   * 检查父菜单是否存在 - 统一异常处理版本
   * @param {String} parentId 父菜单ID
   * @return {Promise<Boolean>} 父菜单是否存在
   * @throws {NotFoundError} 当父菜单不存在时抛出异常
   */
  async checkParentMenuExists(parentId) {
    try {
      // 根级菜单无需检查
      if (parentId === SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID || parentId === '0' || !parentId) {
        return true;
      }

      const parentMenu = await this.findById(parentId);
      if (!parentMenu) {
        throw this.exceptions.menu.parentNotFound(parentId);
      }
      return true;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'checkParentMenuExists', { parentId });
    }
  }

  /**
   * 检查菜单类型有效性 - 统一异常处理版本
   * @param {String} menuType 菜单类型
   * @return {Promise<Boolean>} 菜单类型是否有效
   * @throws {ValidationError} 当菜单类型无效时抛出异常
   */
  async checkMenuTypeValid(menuType) {
    try {
      const validTypes = [SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.DIRECTORY, SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.MENU];

      if (!validTypes.includes(menuType)) {
        throw this.exceptions.menu.invalidMenuType(menuType);
      }
      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'checkMenuTypeValid', { menuType });
    }
  }

  /**
   * 构建菜单树形结构
   * @param {Array} menuList 菜单列表
   * @param {String} parentId 父级ID
   * @return {Array} 树形结构的菜单
   */
  buildMenuTree(menuList, parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID) {
    const tree = [];

    for (const menu of menuList) {
      if (menu.parentId === parentId) {
        const children = this.buildMenuTree(menuList, menu._id);
        if (children.length > 0) {
          menu.children = children;
        }
        tree.push(menu);
      }
    }

    // 按 order 字段排序
    return tree.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * 构建路由树结构
   * @param {Array} allMenus 所有菜单数据
   * @param {Array} userMenus 用户菜单ID数组
   * @param {Object} query 查询参数
   * @return {Array} 路由树结构
   */
  buildRouteTree(allMenus, userMenus = [], query = {}) {
    const includeHiddenRoutes = query.includeHiddenRoutes;

    // 先按权限与 hideInMenu 过滤
    const filteredMenus = allMenus.filter(menu => {
      const menuId = String(menu.id || menu._id);

      if (includeHiddenRoutes) {
        return userMenus.includes(menuId);
      }

      if (query.hideInMenu !== undefined) {
        return !menu.hideInMenu && userMenus.includes(menuId);
      }

      return userMenus.includes(menuId);
    });

    // 构建路由树结构
    const buildRouteTree = (menus, parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID) => {
      const result = [];
      for (const menu of menus) {
        // 注意：MongoDB 中需要处理 _id 和 id 的映射
        const menuId = String(menu.id || menu._id);
        const menuParentId = menu.parentId;
        const hasAccess = userMenus.includes(menuId);

        if ((menuParentId === parentId || menuParentId === Number(parentId)) && hasAccess) {
          const route = {
            name: menu.routeName,
            path: menu.routePath,
            component: menu.component,
            meta: {
              title: menu.menuName,
              i18nKey: menu.i18nKey,
              icon: menu.icon,
              constant: menu.constant,
              order: menu.order,
              keepAlive: menu.keepAlive,
              hideInMenu: menu.hideInMenu,
              activeMenu: menu.activeMenu,
              multiTab: menu.multiTab,
            },
          };

          if (menu.redirect) {
            route.redirect = menu.redirect;
          }

          if (menu.props) {
            route.props = menu.props;
          }

          const children = buildRouteTree(menus, menuId);
          if (children.length) {
            route.children = children;
          }

          result.push(route);
        }
      }
      return result;
    };

    return buildRouteTree(filteredMenus);
  }

  /**
   * 根据父级ID查找菜单
   * @param {String} parentId 父级ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByParentId(parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID, options = {}) {
    try {
      const query = { parentId };
      const standardParams = this._standardizeParams({}, { filters: query, ...options });

      const result = await this.model
        .find(standardParams.query)
        .populate(standardParams.populate)
        .select(standardParams.fields)
        .sort({ order: 1, createdAt: -1 })
        .lean();

      const processedResult = result.map(item => this._postprocessData(item));

      this._logOperation('findByParentId', { parentId, options }, processedResult);
      return processedResult;
    } catch (error) {
      this._handleError(error, 'findByParentId', { parentId, options });
    }
  }

  /**
   * 根据菜单类型查找
   * @param {String} menuType 菜单类型 (1: 目录, 2: 菜单)
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByMenuType(menuType, options = {}) {
    try {
      const query = { menuType };
      const standardParams = this._standardizeParams({}, { filters: query, ...options });

      const result = await this.model
        .find(standardParams.query)
        .populate(standardParams.populate)
        .select(standardParams.fields)
        .sort({ order: 1, createdAt: -1 })
        .lean();

      const processedResult = result.map(item => this._postprocessData(item));

      this._logOperation('findByMenuType', { menuType, options }, processedResult);
      return processedResult;
    } catch (error) {
      this._handleError(error, 'findByMenuType', { menuType, options });
    }
  }

  /**
   * 检查路由路径是否唯一 - 统一异常处理版本
   * @param {String} routePath 路由路径
   * @param {String} excludeId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当路由路径已存在时抛出异常
   */
  async checkRoutePathUnique(routePath, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkRoutePathUnique(this, routePath, excludeId);
      if (!isUnique) {
        throw this.exceptions.menu.routePathExists(routePath);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkRoutePathUnique', { routePath, excludeId });
    }
  }

  /**
   * 检查路由名称是否唯一 - 统一异常处理版本
   * @param {String} routeName 路由名称
   * @param {String} excludeId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当路由名称已存在时抛出异常
   */
  async checkRouteNameUnique(routeName, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkRouteNameUnique(this, routeName, excludeId);
      if (!isUnique) {
        throw this.exceptions.menu.routeNameExists(routeName);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkRouteNameUnique', { routeName, excludeId });
    }
  }

  /**
   * 检查按钮权限标识是否唯一 - 统一异常处理版本
   * @param {Array} permissionCodes 权限标识数组
   * @param {String} excludeMenuId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当权限标识已存在时抛出异常
   */
  async checkButtonPermissionCodesUnique(permissionCodes, excludeMenuId = null) {
    try {
      const query = {
        'buttons.permissionCode': { $in: permissionCodes },
      };

      if (excludeMenuId) {
        query._id = { $ne: excludeMenuId };
      }

      const existingMenus = await this.model.find(query).lean();
      if (existingMenus.length === 0) {
        return true;
      }

      // 收集所有已存在的 button codes
      const existingPermissionCodes = new Set();
      existingMenus.forEach(menu => {
        if (menu.buttons && Array.isArray(menu.buttons)) {
          menu.buttons.forEach(button => {
            if (permissionCodes.includes(button.permissionCode)) {
              existingPermissionCodes.add(button.permissionCode);
            }
          });
        }
      });

      if (existingPermissionCodes.size > 0) {
        const duplicateCodes = Array.from(existingPermissionCodes);
        throw this.exceptions.menu.permissionCodeExists(duplicateCodes.join(', '));
      }

      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkButtonPermissionCodesUnique', { permissionCodes, excludeMenuId });
    }
  }

  /**
   * 获取指定菜单及其所有子菜单
   * @param {String} menuId 菜单ID
   * @return {Promise<Array>} 菜单及其子菜单列表
   */
  async getMenuWithChildren(menuId) {
    try {
      // 获取所有菜单（优化性能，一次性查询）
      const allMenus = await this.model.find().lean();
      // 将MongoDB的_id转换为业务层的id
      const processedMenus = allMenus.map(menu => this._mapIdFromDatabase(menu));

      const targetMenu = processedMenus.find(menu => menu.id === menuId);

      if (!targetMenu) {
        return [];
      }

      const result = [targetMenu];

      // 递归查找子菜单
      const findChildren = parentId => {
        const children = processedMenus.filter(menu => menu.parentId === parentId);
        for (const child of children) {
          result.push(child);
          findChildren(child.id);
        }
      };

      findChildren(menuId);

      this._logOperation('getMenuWithChildren', { menuId }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getMenuWithChildren', { menuId });
    }
  }

  /**
   * 递归获取子菜单
   * @param {String} parentId 父菜单ID
   * @param {Array} allMenus 所有菜单数组
   * @private
   */
  async _getChildrenRecursive(parentId, allMenus) {
    const children = await this.findByParentId(parentId);
    for (const child of children) {
      allMenus.push(child);
      await this._getChildrenRecursive(child._id, allMenus);
    }
  }

  /**
   * 更新菜单排序
   * @param {String} menuId 菜单ID
   * @param {Number} order 新的排序值
   * @return {Promise<Object>} 更新结果
   */
  async updateOrder(menuId, order) {
    try {
      const result = await this.update(menuId, { order });

      this._logOperation('updateOrder', { menuId, order }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'updateOrder', { menuId, order });
    }
  }

  /**
   * 批量更新菜单状态
   * @param {Array} menuIds 菜单ID数组
   * @param {String} status 状态值
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(menuIds, status) {
    try {
      // menuIds 是业务层的id数组，直接作为MongoDB的_id使用
      const result = await this.model.updateMany(
        { _id: { $in: menuIds } },
        { $set: { status, updatedAt: new Date() } }
      );

      this._logOperation('batchUpdateStatus', { menuIds, status }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'batchUpdateStatus', { menuIds, status });
    }
  }

  /**
   * 获取所有按钮的 API 集合
   * @param {Array} menuIds 菜单ID数组
   * @return {Promise<Array>} API 列表
   */
  async getButtonApis(menuIds = []) {
    try {
      const query = {
        menuType: SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.MENU, // 只查询菜单类型为菜单的记录
        buttons: { $exists: true, $ne: [] },
      };

      if (menuIds.length > 0) {
        // menuIds 是业务层的id数组，直接作为MongoDB的_id使用
        query._id = { $in: menuIds };
      }

      const menus = await this.model.find(query).lean();

      const apiSet = new Set();
      menus.forEach(menu => {
        if (menu.buttons && Array.isArray(menu.buttons)) {
          menu.buttons.forEach(button => {
            if (button.api) {
              apiSet.add(button.api);
            }
          });
        }
      });

      const result = Array.from(apiSet);
      this._logOperation('getButtonApis', { menuIds }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getButtonApis', { menuIds });
    }
  }

  /**
   * 获取菜单按钮的权限标识和 API 映射关系
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Array<Object>>} 按钮信息数组 [{permissionCode: String, api: String, menuId: String}]
   */
  async getMenuButtonsWithPermissionCodes(menuIds = []) {
    try {
      const query = {
        menuType: SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.MENU, // 只查询菜单类型为菜单的记录
        buttons: { $exists: true, $ne: [] },
      };

      if (menuIds.length > 0) {
        // menuIds 是业务层的id数组，直接作为MongoDB的_id使用
        query._id = { $in: menuIds };
      }

      const menus = await this.model.find(query).lean();

      // 收集所有按钮的权限标识和 api 映射关系
      const buttonList = [];
      menus.forEach(menu => {
        if (menu.buttons && Array.isArray(menu.buttons)) {
          menu.buttons.forEach(button => {
            if (button.permissionCode) {
              buttonList.push({
                desc: button.desc || '',
                api: button.api || '',
                menuId: menu._id.toString(),
                permissionCode: button.permissionCode,
                httpMethod: button.httpMethod ? button.httpMethod.toUpperCase() : 'POST',
              });
            }
          });
        }
      });

      this._logOperation('getMenuButtonsWithPermissionCodes', { menuIds }, { count: buttonList.length });
      return buttonList;
    } catch (error) {
      this._handleError(error, 'getMenuButtonsWithPermissionCodes', { menuIds });
    }
  }

  /**
   * 获取菜单的路由路径信息（用于没有配置按钮的菜单）
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Array<Object>>} 菜单路由信息数组 [{id: String, routePath: String, hasButtons: Boolean}]
   */
  async getMenuRoutePaths(menuIds = []) {
    try {
      const query = {
        menuType: SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.MENU, // 只查询菜单类型为菜单的记录
      };

      if (menuIds.length > 0) {
        query._id = { $in: menuIds };
      }

      const menus = await this.model.find(query).lean();

      // 返回菜单路由信息
      const menuRoutes = menus.map(menu => ({
        id: menu._id.toString(),
        routePath: menu.routePath,
        hasButtons: menu.buttons && Array.isArray(menu.buttons) && menu.buttons.length > 0,
      }));

      this._logOperation('getMenuRoutePaths', { menuIds }, { count: menuRoutes.length });
      return menuRoutes;
    } catch (error) {
      this._handleError(error, 'getMenuRoutePaths', { menuIds });
    }
  }

  /**
   * 根据ID数组查找菜单
   * @param {Array} menuIds 菜单ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByIds(menuIds, options = {}) {
    try {
      const query = { _id: { $in: menuIds } };
      const standardParams = this._standardizeParams({}, { filters: query, ...options });

      const result = await this.model
        .find(standardParams.query)
        .populate(standardParams.populate)
        .select(standardParams.fields)
        .sort({ order: 1, createdAt: -1 })
        .lean();

      const processedResult = result.map(item => this._postprocessData(item));

      this._logOperation('findByIds', { menuIds, options }, processedResult);
      return processedResult;
    } catch (error) {
      this._handleError(error, 'findByIds', { menuIds, options });
    }
  }

  /**
   * 查找用户菜单
   * @param {Array} userMenuIds 用户菜单ID数组
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findUserMenus(userMenuIds, payload = {}, options = {}) {
    try {
      const filters = {
        _id: { $in: userMenuIds },
        status: SYSTEM_CONSTANTS.STATUS.ENABLED, // 只查找启用的菜单
        ...options.filters,
      };

      const result = await this.find(payload, { ...options, filters });

      this._logOperation('findUserMenus', { userMenuIds, payload, options }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'findUserMenus', { userMenuIds, payload, options });
    }
  }

  /**
   * 根据按钮权限标识查找菜单
   * @param {Array} permissionCodes 权限标识数组
   * @return {Promise<Array>} 菜单列表
   */
  async findMenusByPermissionCodes(permissionCodes) {
    try {
      const query = {
        'buttons.permissionCode': { $in: permissionCodes },
      };

      const result = await this.model.find(query).select('menuName routeName routePath buttons').lean();

      const processedResult = result.map(item => this._postprocessData(item));

      this._logOperation('findMenusByPermissionCodes', { permissionCodes }, processedResult);
      return processedResult;
    } catch (error) {
      this._handleError(error, 'findMenusByPermissionCodes', { permissionCodes });
    }
  }

  /**
   * 获取菜单路径
   * @param {String} menuId 菜单ID
   * @return {Promise<Array>} 菜单路径数组
   */
  async getMenuPath(menuId) {
    try {
      const path = [];
      let currentMenu = await this.findById(menuId);

      while (currentMenu) {
        path.unshift(currentMenu);
        if (currentMenu.parentId === SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID) {
          break;
        }
        currentMenu = await this.findById(currentMenu.parentId);
      }

      this._logOperation('getMenuPath', { menuId }, path);
      return path;
    } catch (error) {
      this._handleError(error, 'getMenuPath', { menuId });
    }
  }

  /**
   * 根据国际化键查找菜单
   * @param {String} i18nKey 国际化键
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByI18nKey(i18nKey, options = {}) {
    try {
      const query = { i18nKey };
      const standardParams = this._standardizeParams({}, { filters: query, ...options });

      const result = await this.model
        .find(standardParams.query)
        .populate(standardParams.populate)
        .select(standardParams.fields)
        .lean();

      const processedResult = result.map(item => this._postprocessData(item));

      this._logOperation('findByI18nKey', { i18nKey, options }, processedResult);
      return processedResult;
    } catch (error) {
      this._handleError(error, 'findByI18nKey', { i18nKey, options });
    }
  }

  /**
   * 获取菜单统计信息
   * @return {Promise<Object>} 统计信息
   */
  async getMenuStats() {
    try {
      // 这些统计查询不涉及ID字段，无需进行ID映射
      const totalCount = await this.model.countDocuments();
      const enabledCount = await this.model.countDocuments({
        status: SYSTEM_CONSTANTS.STATUS.ENABLED,
      });
      const directoryCount = await this.model.countDocuments({
        menuType: SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.DIRECTORY,
      });
      const menuCount = await this.model.countDocuments({
        menuType: SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.MENU,
      });

      const stats = {
        total: totalCount,
        enabled: enabledCount,
        disabled: totalCount - enabledCount,
        directories: directoryCount,
        menus: menuCount,
      };

      this._logOperation('getMenuStats', {}, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getMenuStats', {});
    }
  }

  // ===== 辅助方法 =====

  // 🔥 _postprocessData 已移到基类 BaseStandardRepository

  // 🔥 _getStatusText 已移到基类 BaseStandardRepository

  /**
   * 重写状态映射（Menu模块特定）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（Menu特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @param options
   * @return {Object} 最终数据项
   * @protected
   */
  // eslint-disable-next-line no-unused-vars
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 处理菜单类型文本（Menu特有逻辑）
    if (item.menuType) {
      item.menuTypeText = this._getMenuTypeText(item.menuType);
    }

    // 确保buttons数组存在
    if (!item.buttons) {
      item.buttons = [];
    }

    // 确保query数组存在
    if (!item.query) {
      item.query = [];
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 获取菜单类型文本
   * @param {String} menuType 菜单类型
   * @return {String} 菜单类型文本
   * @private
   */
  _getMenuTypeText(menuType) {
    return SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE_TEXT[menuType] || '未知类型';
  }

  // 🔥 _preprocessDataForCreate, _preprocessDataForUpdate 已移到基类 BaseStandardRepository

  /**
   * 子类自定义的创建前数据处理（Menu特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 确保必要的默认值（Menu特有逻辑）
    if (!data.parentId) {
      data.parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID;
    }
    if (!data.order) {
      data.order = 0;
    }
    if (!data.iconType) {
      data.iconType = '1';
    }

    return data;
  }

  /**
   * 验证数据
   * @param {Object} data 要验证的数据
   * @param {String} operation 操作类型 ('create' | 'update')
   * @return {Object} 验证结果
   * @private
   */
  _validateData(data, operation) {
    const errors = [];

    if (operation === 'create') {
      // 创建时的必需字段验证
      if (!data.menuName) {
        errors.push('菜单名称不能为空');
      }
      if (!data.routeName) {
        errors.push('路由名称不能为空');
      }
      if (!data.routePath) {
        errors.push('路由路径不能为空');
      }
      if (!data.menuType) {
        errors.push('菜单类型不能为空');
      }
    }

    // 通用验证
    const validMenuTypes = [
      SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.DIRECTORY,
      SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.MENU,
    ];
    if (data.menuType && !validMenuTypes.includes(data.menuType)) {
      errors.push('菜单类型必须是 1（目录）或 2（菜单）');
    }

    const validStatuses = [SYSTEM_CONSTANTS.STATUS.ENABLED, SYSTEM_CONSTANTS.STATUS.DISABLED];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('状态必须是 0（禁用）或 1（启用）');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = MenuMongoRepository;
