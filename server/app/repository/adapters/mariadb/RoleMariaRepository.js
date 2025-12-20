/**
 * 标准化的 Role MariaDB Repository
 * 基于Menu模块的成功经验
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const RoleSchema = require('../../schemas/mariadb/RoleSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const { UniqueConstraintError, ValidationError } = require('../../../exceptions');
const _ = require('lodash');

class RoleMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'Role');

    // 设置数据库类型为 MariaDB
    this.databaseType = 'mariadb';

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;

    // 确保连接初始化
    this._initializeConnection();
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    if (!this.model) {
      await this.connection.initialize();
      const sequelize = this.connection.getSequelize();

      // 动态加载 Role Schema
      this.model = RoleSchema(sequelize, this.app);

      // 注册模型和关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // Role模块暂无复杂关联关系
        },
      });

      // 🔥 配置智能更新策略（基于Menu模块经验）
      this.configureUpdateStrategies({
        required: ['roleName', 'roleCode'],
        independent: ['status', 'roleDesc', 'menus', 'buttons', 'createBy', 'updateBy', 'updatedAt', 'createdAt'],
        relational: [], // Role模块暂无复杂关联
      });
    }
  }

  /**
   * 确保数据库连接
   * @private
   */
  async _ensureConnection() {
    if (!this.model) {
      await this._initializeConnection();
    }
  }

  // ===== 核心 CRUD 方法 =====

  /**
   * 查找记录列表
   * @param payload
   * @param options
   */
  async find(payload = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 标准化参数并转换为 MariaDB 格式
      const standardParams = this._standardizeParams(payload, options);

      // 构建查询条件
      const queryOptions = await this._buildQueryOptions(standardParams);

      // 处理搜索条件（注意参数名是searchkey不是keyword）
      if (options.searchKeys && payload.searchkey) {
        queryOptions.where = {
          ...queryOptions.where,
          ...this._buildSearchCondition(payload.searchkey, options.searchKeys),
        };
      }

      // 执行查询
      let result;
      const { pagination } = standardParams;
      if (pagination.isPaging) {
        const { count, rows } = await this.model.findAndCountAll(queryOptions);
        result = {
          docs: rows,
          count,
        };
      } else {
        result = await this.model.findAll(queryOptions);
      }

      // 处理结果数据
      const processedResult = this._processResult(result, { ...pagination, ...payload });

      return processedResult;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  /**
   * 查找单条记录
   * @param query
   * @param options
   */
  async findOne(query = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 标准化参数并转换为 MariaDB 格式
      const standardParams = this._standardizeParams(
        {}, // 空的 payload
        {
          filters: query,
          populate: options.populate || [],
          fields: options.fields,
          pagination: { isPaging: false },
        }
      );

      // 构建查询选项
      const queryOptions = await this._buildQueryOptions(standardParams);

      // 执行查询
      const result = await this.model.findOne(queryOptions);

      // 处理结果
      return result ? result.toJSON() : null;
    } catch (error) {
      this._handleError(error, 'findOne', { query, options });
    }
  }

  /**
   * 根据ID查找记录
   * @param id
   * @param options
   */
  async findById(id, options = {}) {
    const query = { id };
    return await this.findOne(query, options);
  }

  /**
   * 统计记录数量
   * @param filters
   */
  async count(filters = {}) {
    await this._ensureConnection();

    try {
      // 标准化参数并转换为 MariaDB 格式
      const standardParams = this._standardizeParams(
        {}, // 空的 payload
        {
          filters,
          pagination: { isPaging: false },
        }
      );

      // 执行统计
      const count = await this.model.count({ where: standardParams.where });

      this._logOperation('count', { filters }, count);
      return count;
    } catch (error) {
      this._handleError(error, 'count', { filters });
    }
  }

  /**
   * 创建记录
   * @param data
   */
  async create(data) {
    await this._ensureConnection();

    try {
      // 预处理数据
      const processedData = this._preprocessDataForCreate(data);

      // 创建主记录
      const result = await this.model.create(processedData);

      // 获取完整数据
      const fullResult = await this.findById(result.id, {
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('create', { data }, fullResult);
      return fullResult;
    } catch (error) {
      this._handleError(error, 'create', { data });
    }
  }

  /**
   * 更新记录（使用智能更新策略）
   * @param id
   * @param data
   * @param options
   */
  async update(id, data, options = {}) {
    await this._ensureConnection();

    try {
      // 转换ID
      const mariadbId = this.transformer.transformQueryForMariaDB({ id }).id;

      // 🔥 使用智能更新策略（基于Menu模块经验）
      const { processedData, updateOptions } = await this.smartUpdate(mariadbId, data, options);

      // 更新主记录
      await this.model.update(processedData, updateOptions);

      // 获取更新后的完整数据
      const fullResult = await this.findById(id, {
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('update', { id, data }, fullResult);
      return fullResult;
    } catch (error) {
      this._handleError(error, 'update', { id, data });
    }
  }

  /**
   * 删除记录
   * @param ids
   * @param key
   */
  async remove(ids, key = 'id') {
    await this._ensureConnection();

    try {
      // 转换ID格式
      const mariadbIds = Array.isArray(ids)
        ? ids.map(id => this.transformer.transformQueryForMariaDB({ id }).id)
        : this.transformer.transformQueryForMariaDB({ id: ids }).id;

      const whereCondition = Array.isArray(mariadbIds) ? { id: { [this.Op.in]: mariadbIds } } : { id: mariadbIds };

      const result = await this.model.destroy({ where: whereCondition });
      this._logOperation('remove', { ids, key }, result);
      return { deletedCount: result };
    } catch (error) {
      this._handleError(error, 'remove', { ids, key });
    }
  }

  /**
   * 软删除记录
   * @param ids
   * @param updateObj
   */
  async safeDelete(ids, updateObj = { status: '0' }) {
    await this._ensureConnection();

    try {
      // 转换ID格式
      const mariadbIds = Array.isArray(ids)
        ? ids.map(id => this.transformer.transformQueryForMariaDB({ id }).id)
        : this.transformer.transformQueryForMariaDB({ id: ids }).id;

      const whereCondition = Array.isArray(mariadbIds) ? { id: { [this.Op.in]: mariadbIds } } : { id: mariadbIds };

      const [result] = await this.model.update(updateObj, { where: whereCondition });
      this._logOperation('safeDelete', { ids, updateObj }, result);
      return { modifiedCount: result };
    } catch (error) {
      this._handleError(error, 'safeDelete', { ids, updateObj });
    }
  }

  // ===== Role 特有的业务方法 =====

  /**
   * 根据角色名称查找角色
   * @param {String} roleName 角色名称
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 角色信息
   */
  async findByRoleName(roleName, options = {}) {
    const query = { roleName };
    return await this.findOne(query, options);
  }

  /**
   * 根据角色代码查找角色
   * @param {String} roleCode 角色代码
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 角色信息
   */
  async findByRoleCode(roleCode, options = {}) {
    const query = { roleCode };
    return await this.findOne(query, options);
  }

  // ===== 🔥 重写CRUD方法以包含自动唯一性验证 =====

  /**
   * 创建角色（自动验证唯一性）
   * @param {Object} data 角色数据
   * @return {Promise<Object>} 创建的角色
   * @throws {UniqueConstraintError} 当roleCode不唯一时抛出
   */
  async create(data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性
      if (data.roleCode) {
        await this.checkRoleCodeUnique(data.roleCode);
      }
      if (data.roleName) {
        await this.checkRoleNameUnique(data.roleName);
      }

      // 调用父类的create方法
      return await super.create(data);
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'create', data);
    }
  }

  /**
   * 更新角色（自动验证唯一性）
   * @param {String} id 角色ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的角色
   * @throws {UniqueConstraintError} 当roleCode不唯一时抛出
   */
  async update(id, data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性（排除当前ID）
      if (data.roleCode) {
        await this.checkRoleCodeUnique(data.roleCode, id);
      }
      if (data.roleName) {
        await this.checkRoleNameUnique(data.roleName, id);
      }

      // 调用父类的update方法
      return await super.update(id, data);
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'update', { id, data });
    }
  }

  // ===== 🔥 Role 特有的业务方法 =====

  /**
   * 检查角色代码是否唯一 - 统一异常处理版本
   * @param {String} roleCode 角色代码
   * @param {String} excludeId 排除的角色ID（用于编辑时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当角色代码已存在时抛出异常
   */
  async checkRoleCodeUnique(roleCode, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkRoleCodeUnique(this, roleCode, excludeId);
      if (!isUnique) {
        throw this.exceptions.role.codeExists(roleCode);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkRoleCodeUnique', { roleCode, excludeId });
    }
  }

  /**
   * 检查角色代码是否已存在（兼容旧接口）
   * @param {String} roleCode 角色代码
   * @param {String} excludeId 排除的角色ID（用于编辑时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkRoleCodeExists(roleCode, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkRoleCodeUnique(this, roleCode, excludeId);
      const exists = !isUnique;
      this._logOperation('checkRoleCodeExists', { roleCode, excludeId }, exists);
      return exists;
    } catch (error) {
      this._handleError(error, 'checkRoleCodeExists', { roleCode, excludeId });
      return false;
    }
  }

  /**
   * 检查角色名称是否唯一 - 统一异常处理版本
   * @param {String} roleName 角色名称
   * @param {String} excludeId 排除的角色ID（用于编辑时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当角色名称已存在时抛出异常
   */
  async checkRoleNameUnique(roleName, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkFieldUnique(this, 'roleName', roleName, excludeId);
      if (!isUnique) {
        throw this.exceptions.role.nameExists(roleName);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkRoleNameUnique', { roleName, excludeId });
    }
  }

  /**
   * 检查角色名称是否已存在（兼容旧接口）
   * @param {String} roleName 角色名称
   * @param {String} excludeId 排除的角色ID（用于编辑时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkRoleNameExists(roleName, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkFieldUnique(this, 'roleName', roleName, excludeId);
      const exists = !isUnique;
      this._logOperation('checkRoleNameExists', { roleName, excludeId }, exists);
      return exists;
    } catch (error) {
      this._handleError(error, 'checkRoleNameExists', { roleName, excludeId });
      return false;
    }
  }

  /**
   * 根据状态查找角色
   * @param {String} status 状态 ('1': 启用, '2': 禁用)
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByStatus(status, payload = {}, options = {}) {
    const mergedOptions = {
      ...options,
      filters: { status: { $eq: status }, ...(options.filters || {}) },
    };
    return await this.find(payload, mergedOptions);
  }

  /**
   * 获取所有启用的角色
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的角色列表
   */
  async getEnabledRoles(options = {}) {
    const payload = { isPaging: '0' };
    const mergedOptions = {
      filters: { status: { $eq: SYSTEM_CONSTANTS.STATUS.ENABLED } },
      fields: options.fields || ['id', 'roleName', 'roleCode', 'roleDesc'],
      sort: [{ field: 'createdAt', order: 'asc' }],
      ...options,
    };
    return await this.find(payload, mergedOptions);
  }

  // ===== Role 权限管理方法 =====

  /**
   * 更新角色菜单权限
   * @param {String} roleId 角色ID
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRoleMenus(roleId, menuIds) {
    const updateData = {
      menus: Array.isArray(menuIds) ? menuIds : [],
    };
    return await this.update(roleId, updateData);
  }

  /**
   * 更新角色按钮权限
   * @param {String} roleId 角色ID
   * @param {Array<String>} buttonCodes 按钮代码数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRoleButtons(roleId, buttonCodes) {
    const updateData = {
      buttons: Array.isArray(buttonCodes) ? buttonCodes : [],
    };
    return await this.update(roleId, updateData);
  }

  /**
   * 批量更新角色权限（菜单+按钮）
   * @param {String} roleId 角色ID
   * @param {Array<String>} menuIds 菜单ID数组
   * @param {Array<String>} buttonCodes 按钮代码数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRolePermissions(roleId, menuIds, buttonCodes) {
    const updateData = {
      menus: Array.isArray(menuIds) ? menuIds : [],
      buttons: Array.isArray(buttonCodes) ? buttonCodes : [],
    };
    return await this.update(roleId, updateData);
  }

  /**
   * 根据菜单ID查找拥有该菜单权限的角色
   * @param {String} menuId 菜单ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async findRolesByMenuId(menuId, options = {}) {
    const payload = { isPaging: '0' };
    const mergedOptions = {
      filters: { menus: { $regex: menuId } },
      fields: options.fields || ['id', 'roleName', 'roleCode'],
      ...options,
    };
    return await this.find(payload, mergedOptions);
  }

  /**
   * 根据按钮代码查找拥有该按钮权限的角色
   * @param {String} buttonCode 按钮代码
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async findRolesByButtonCode(buttonCode, options = {}) {
    const payload = { isPaging: '0' };
    const mergedOptions = {
      filters: { buttons: { $regex: buttonCode } },
      fields: options.fields || ['id', 'roleName', 'roleCode'],
      ...options,
    };
    return await this.find(payload, mergedOptions);
  }

  /**
   * 获取角色的完整权限信息（包含菜单和按钮详细信息）
   * @param {String} roleId 角色ID
   * @return {Promise<Object|null>} 角色权限信息
   */
  async getRolePermissions(roleId) {
    const role = await this.findById(roleId);
    if (!role) {
      return null;
    }

    return {
      id: role.id,
      roleName: role.roleName,
      roleCode: role.roleCode,
      menus: role.menus || [],
      buttons: role.buttons || [],
    };
  }

  // ===== Role 批量操作方法 =====

  /**
   * 批量更新角色状态
   * @param {Array<String>} roleIds 角色ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async updateRolesStatus(roleIds, status) {
    await this._ensureConnection();

    try {
      const updateData = { status };

      const mariadbIds = roleIds.map(id => this.transformer.transformQueryForMariaDB({ id }).id);
      const where = { id: { [this.Op.in]: mariadbIds } };
      const [affectedRows] = await this.model.update(updateData, { where });

      const result = {
        success: true,
        modifiedCount: affectedRows,
        matchedCount: roleIds.length,
      };

      this._logOperation('updateRolesStatus', { roleIds, status }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'updateRolesStatus', { roleIds, status });
    }
  }

  /**
   * 清理无效的菜单权限（当菜单被删除时）
   * @param {Array<String>} deletedMenuIds 已删除的菜单ID数组
   * @return {Promise<Object>} 清理结果
   */
  async cleanInvalidMenuPermissions(deletedMenuIds) {
    try {
      if (!Array.isArray(deletedMenuIds) || deletedMenuIds.length === 0) {
        return { success: true, modifiedCount: 0 };
      }

      await this._ensureConnection();

      // 查找包含这些菜单ID的角色
      const rolesToUpdate = await this.model.findAll({
        attributes: ['id', 'menus'],
      });

      let modifiedCount = 0;
      for (const role of rolesToUpdate) {
        const currentMenus = role.menus || [];
        const filteredMenus = currentMenus.filter(id => !deletedMenuIds.includes(id));

        if (filteredMenus.length !== currentMenus.length) {
          await this.model.update(
            {
              menus: filteredMenus,
              updatedAt: new Date(),
            },
            { where: { id: role.id } }
          );
          modifiedCount++;
        }
      }

      const result = {
        success: true,
        modifiedCount,
        matchedCount: rolesToUpdate.length,
      };

      this._logOperation('cleanInvalidMenuPermissions', { deletedMenuIds }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'cleanInvalidMenuPermissions', { deletedMenuIds });
    }
  }

  /**
   * 统计角色相关数据
   * @return {Promise<Object>} 统计信息
   */
  async getRoleStats() {
    try {
      const total = await this.count();
      const enabled = await this.count({ status: { $eq: SYSTEM_CONSTANTS.STATUS.ENABLED } });
      const disabled = await this.count({ status: { $eq: SYSTEM_CONSTANTS.STATUS.DISABLED } });

      const result = {
        total,
        enabled,
        disabled,
        enabledPercentage: total > 0 ? Math.round((enabled / total) * 100) : 0,
      };

      this._logOperation('getRoleStats', {}, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getRoleStats', {});
    }
  }

  // ===== 辅助方法 =====

  /**
   * 获取默认的关联查询配置
   * @private
   */
  _getDefaultPopulate() {
    return [
      // Role模块暂无复杂关联查询需求
    ];
  }

  /**
   * 预处理创建数据
   * @param {Object} data 原始数据
   * @return {Object} 处理后的数据
   * @private
   */
  _preprocessDataForCreate(data) {
    const processedData = { ...data };

    // 设置创建时间
    processedData.createdAt = new Date();
    processedData.updatedAt = new Date();

    // 🔥 设置默认值（基于Menu模块经验）
    if (!processedData.status) {
      processedData.status = SYSTEM_CONSTANTS.STATUS.ENABLED;
    }

    // 确保数组字段
    processedData.menus = processedData.menus || [];
    processedData.buttons = processedData.buttons || [];

    return processedData;
  }

  // 🔥 根据具体业务需求添加其他方法...
  // 参考Menu模块实现：findByParentId, checkUniqueField, buildTree, batchUpdateStatus 等
}

module.exports = RoleMariaRepository;
