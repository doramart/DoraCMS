/**
 * 标准化的 Role MongoDB Repository
 * 基于Menu模块的成功实践
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
// const { UniqueConstraintError, ValidationError } = require('../../../exceptions');
// const _ = require('lodash');

class RoleMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Role');

    // 设置 MongoDB 模型
    this.model = this.app.model.Role;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // Role模块暂无复杂关联关系
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
      // Role模块暂无复杂关联查询需求
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['roleName', 'roleCode', 'roleDesc'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
  }

  // 🔥 find() 方法已在 BaseMongoRepository 中实现，直接使用父类方法

  // 🔥 核心CRUD方法已在 BaseMongoRepository 中实现
  // findOne(), findById(), count(), create(), update(), remove(), safeDelete()
  // 直接使用父类的增强版方法

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
   * 检查角色代码是否唯一
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
   * 检查角色名称是否唯一
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
      filters: { menus: { $in: [menuId] } },
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
      filters: { buttons: { $in: [buttonCode] } },
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
      id: role.id || role._id,
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
    try {
      const updateData = { status };

      // 🔥 关键：业务层传入的roleIds直接作为MongoDB的_id使用（基于Menu模块实践）
      const result = await this.model.updateMany({ _id: { $in: roleIds } }, { $set: updateData });

      // 记录操作日志
      this._logOperation('updateRolesStatus', { roleIds, status }, result);

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      };
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

      // 从所有角色中移除已删除的菜单ID
      const result = await this.model.updateMany(
        { menus: { $in: deletedMenuIds } },
        {
          $pull: { menus: { $in: deletedMenuIds } },
          $set: { updatedAt: new Date() },
        }
      );

      // 记录操作日志
      this._logOperation('cleanInvalidMenuPermissions', { deletedMenuIds }, result);

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      };
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

      // 记录操作日志
      this._logOperation('getRoleStats', {}, result);

      return result;
    } catch (error) {
      this._handleError(error, 'getRoleStats', {});
    }
  }

  // ===== 辅助方法 =====

  // 🔥 _postprocessData, _processDataItem, _preprocessDataForCreate, _preprocessDataForUpdate 已移到基类

  /**
   * 重写状态映射（Role模块特定）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（Role特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @param options
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 确保数组字段的默认值
    item.menus = item.menus || [];
    item.buttons = item.buttons || [];

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（Role特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 确保数组字段
    data.menus = data.menus || [];
    data.buttons = data.buttons || [];

    return data;
  }

  // 根据具体业务需求添加其他方法...
}

module.exports = RoleMongoRepository;
