/**
 * 优化后的 Admin MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 Admin 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 Admin 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 通用化关联字段处理 - EnhancedDataTransformer 动态获取关联字段
 * 2. 基类提供通用 CRUD 方法 - 子类专注业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持所有模型的自定义 getter
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
// const AdminSchema = require('../../schemas/mariadb/AdminSchema');
// const RoleSchema = require('../../schemas/mariadb/RoleSchema');
// const AdminRoleSchema = require('../../schemas/mariadb/AdminRoleSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const CryptoUtil = require('../../../utils/CryptoUtil');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');

class AdminMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'Admin');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
    this.roleModel = null;
    this.adminRoleModel = null;

    // 注意：不在构造函数中同步调用 _initializeConnection
    // 而是在 _ensureConnection 中异步调用
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      // 确保连接管理器已初始化
      await this.connection.initialize();

      // 🔥 修复：使用连接管理器中已建立关联关系的模型
      this.model = this.connection.getModel('Admin');
      this.roleModel = this.connection.getModel('Role');
      this.adminRoleModel = this.connection.getModel('AdminRole');

      if (!this.model || !this.roleModel || !this.adminRoleModel) {
        throw new Error('Admin, Role 或 AdminRole 模型未找到，请检查模型加载顺序');
      }

      // 🔥 关联关系现在在Schema中定义，无需手动建立

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          userRoles: {
            model: this.roleModel,
            type: 'belongsToMany',
            through: this.adminRoleModel,
            foreignKey: 'adminId',
            otherKey: 'roleId',
            as: 'userRoles',
            select: ['id', 'roleName', 'roleCode', 'status', 'menus', 'buttons'],
          },
        },
      });

      // 🔥 调试：检查关联关系是否正确注册
      console.log('🔍 Admin 关联映射检查:', this.transformer.relationMappings.get('Admin.userRoles'));
      // console.log('🔍 Admin 模型关联:', Object.keys(this.model.associations || {}));

      // console.log('✅ AdminMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ AdminMariaRepository initialization failed:', error);
      throw error;
    }
  }

  // 🔥 _setupAssociations 方法已移除
  // 关联关系现在在 AdminSchema.js、RoleSchema.js、AdminRoleSchema.js 中统一定义

  /**
   * 确保连接已建立
   * @private
   */
  async _ensureConnection() {
    if (!this.model) {
      await this._initializeConnection();
    }
  }

  // ===== 🔥 重写基类的抽象方法 - Admin 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      {
        model: this.roleModel,
        as: 'userRoles',
        attributes: ['id', 'roleName', 'roleCode', 'status', 'menus', 'buttons'],
        through: {
          attributes: [], // 不返回中间表字段
          where: { status: SYSTEM_CONSTANTS.STATUS.ENABLED }, // 只查询有效的关联
        },
        where: { status: SYSTEM_CONSTANTS.STATUS.ENABLED }, // 只查询启用的角色
      },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['userName', 'nickName', 'userPhone', 'userEmail'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
  }

  /**
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.STATUS_TEXT;
  }

  /**
   * 🔥 优化版：不再需要手动维护字段列表！
   * 基类会自动从AdminSchema获取所有字段
   * 只需要处理特殊情况（排除关联字段等）
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    // 直接使用基类的自动检测功能
    return super._getValidTableFields();
  }

  /**
   * 重写：获取需要排除的字段
   * 🔥 Admin特有的关联字段和虚拟字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // Admin模块特有的需要排除的字段
    const adminExcludeFields = [
      'userRoles', // 关联字段 - 通过中间表管理
      'roles', // 关联字段
      'roleNames', // 虚拟字段
    ];

    return [...baseExcludeFields, ...adminExcludeFields];
  }

  /**
   * 重写：获取额外需要包含的字段（如果Schema中没有但需要查询的）
   * @return {Array} 额外字段列表
   * @protected
   */
  _getAdditionalTableFields() {
    // 如果有一些计算字段或者特殊字段需要包含，在这里添加
    return [
      // 例如：'fullName', 'displayName' 等虚拟字段
    ];
  }

  /**
   * 处理自定义 JSON 字段 - Admin 特有的 Role 模型处理
   * @param {Object} instance Sequelize 实例
   * @param {Object} json 转换后的 JSON 对象
   * @protected
   */
  _processCustomJsonFields(instance, json) {
    // 特别处理 Role 模型的 JSON 字段
    if (instance.constructor.name === 'Role' || (instance.Model && instance.Model.name === 'Role')) {
      if (instance.get) {
        try {
          json.menus = instance.get('menus') || [];
          json.buttons = instance.get('buttons') || [];
        } catch (error) {
          console.warn('Error getting JSON fields from Role instance:', error.message);
          json.menus = json.menus || [];
          json.buttons = json.buttons || [];
        }
      }
    }
  }

  /**
   * 子类自定义的数据项处理 - Admin 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @param options
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item, options);

    // 添加 Admin 特有的数据处理
    // 添加性别文本
    if (item.userGender) {
      item.userGenderText = SYSTEM_CONSTANTS.USER.GENDER_TEXT[item.userGender] || '未知';
    }

    // 确保敏感信息被移除 - 但如果 options.fields 中明确包含 password 则保留
    if (item.password && !this._shouldIncludeField('password', options)) {
      delete item.password;
    }

    // 确保数组字段的默认值
    item.userRoles = item.userRoles || [];

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - Admin 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 Admin 特有的创建前处理
    // 🔥 注意：密码加密由 AdminSchema 的 set 方法自动处理，这里不需要手动加密
    // 否则会导致密码被加密两次

    // 设置默认值
    if (!data.userRoles) data.userRoles = [];

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - Admin 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 Admin 特有的更新前处理
    // 🔥 注意：密码加密由 AdminSchema 的 set 方法自动处理，这里不需要手动加密
    // 否则会导致密码被加密两次

    return data;
  }

  // ===== 🔥 重写基类方法以处理角色关联 =====

  /**
   * 重写 create 方法以处理角色关联和唯一性验证
   * @param {Object} data 创建数据
   * @return {Promise<Object>} 创建结果
   * @throws {UniqueConstraintError} 当字段不唯一时抛出
   */
  async create(data) {
    await this._ensureConnection();

    try {
      // 🔥 Phase2优化：自动验证唯一性
      if (data.userName) {
        await this.checkUserNameUnique(data.userName);
      }
      if (data.userEmail) {
        await this.checkEmailUnique(data.userEmail);
      }
      if (data.userPhone) {
        await this.checkPhoneUnique(data.userPhone);
      }

      // 开始事务处理角色关联
      const transaction = await this.connection.getSequelize().transaction();

      try {
        const { userRoles, ...mainData } = data;
        const processedData = this._customPreprocessForCreate(mainData);
        const result = await this.model.create(processedData, { transaction });

        if (userRoles && Array.isArray(userRoles) && userRoles.length > 0) {
          await this._createRoleRelations(result.id, userRoles, {
            transaction,
            createBy: data.createBy || 'system',
          });
        }

        await transaction.commit();

        const fullResult = await this.findById(result.id, {
          populate: this._getDefaultPopulate(),
        });

        this._logOperation('create', { data }, fullResult);
        return fullResult;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'create', { data });
    }
  }

  /**
   * 重写 update 方法以包含唯一性验证
   * @param {String} id 管理员ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的管理员
   * @throws {UniqueConstraintError} 当字段不唯一时抛出
   */
  async update(id, data) {
    try {
      // 🔥 Phase2优化：自动验证唯一性（排除当前ID）
      if (data.userName) {
        await this.checkUserNameUnique(data.userName, id);
      }
      if (data.userEmail) {
        await this.checkEmailUnique(data.userEmail, id);
      }
      if (data.userPhone) {
        await this.checkPhoneUnique(data.userPhone, id);
      }

      const hasUserRoles = Object.prototype.hasOwnProperty.call(data, 'userRoles');

      if (!hasUserRoles) {
        // 未传 userRoles 时，保持原有更新逻辑
        return await super.update(id, data);
      }

      await this._ensureConnection();
      const { userRoles, ...mainData } = data || {};
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];

      const transaction = await this.connection.getSequelize().transaction();
      try {
        const processedData = this._customPreprocessForUpdate(mainData);

        if (processedData && Object.keys(processedData).length > 0) {
          await this.model.update(processedData, {
            where: { id },
            transaction,
            validate: true,
          });
        }

        // 更新关联表：admin_roles
        await this.adminRoleModel.destroy({
          where: { adminId: id },
          transaction,
        });

        if (normalizedRoles.length > 0) {
          await this._createRoleRelations(id, normalizedRoles, {
            transaction,
            createBy: data.updateBy || data.createBy || 'system',
          });
        }

        await transaction.commit();
      } catch (innerError) {
        await transaction.rollback();
        throw innerError;
      }

      const fullResult = await this.findById(id, {
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('update', { id, data }, fullResult);
      return fullResult;
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'update', { id, data });
    }
  }

  // ===== 🔥 Admin 特有的业务方法 =====

  /**
   * 检查用户名是否唯一
   * @param {String} userName 用户名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当用户名已存在时抛出异常
   */
  async checkUserNameUnique(userName, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkUserNameUnique(this, userName, excludeId);
      if (!isUnique) {
        throw this.exceptions.user.nameExists(userName);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkUserNameUnique', { userName, excludeId });
    }
  }

  /**
   * 检查手机号是否唯一
   * @param {String} userPhone 手机号
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当手机号已存在时抛出异常
   */
  async checkPhoneUnique(userPhone, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkPhoneUnique(this, userPhone, excludeId);
      if (!isUnique) {
        throw this.exceptions.user.phoneExists(userPhone);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkPhoneUnique', { userPhone, excludeId });
    }
  }

  /**
   * 检查邮箱是否唯一
   * @param {String} userEmail 邮箱
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当邮箱已存在时抛出异常
   */
  async checkEmailUnique(userEmail, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkEmailUnique(this, userEmail, excludeId);
      if (!isUnique) {
        throw this.exceptions.user.emailExists(userEmail);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkEmailUnique', { userEmail, excludeId });
    }
  }

  /**
   * 根据用户名查找管理员
   * @param {String} userName 用户名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 管理员信息
   */
  async findByUserName(userName, options = {}) {
    try {
      const query = { userName };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByUserName', { userName, options });
    }
  }

  /**
   * 根据邮箱查找管理员
   * @param {String} userEmail 邮箱
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 管理员信息
   */
  async findByEmail(userEmail, options = {}) {
    try {
      const query = { userEmail };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByEmail', { userEmail, options });
    }
  }

  /**
   * 根据手机号查找管理员
   * @param {String} userPhone 手机号
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 管理员信息
   */
  async findByPhone(userPhone, options = {}) {
    try {
      const query = { userPhone };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByPhone', { userPhone, options });
    }
  }

  /**
   * 根据角色查找管理员
   * @param {String|Array} roleIds 角色ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByRoles(roleIds, payload = {}, options = {}) {
    try {
      await this._ensureConnection();
      const roles = Array.isArray(roleIds) ? roleIds : [roleIds];

      // 通过中间表查询
      const adminIds = await this.adminRoleModel.findAll({
        where: {
          roleId: { [this.Op.in]: roles },
          status: SYSTEM_CONSTANTS.STATUS.ENABLED,
        },
        attributes: ['adminId'],
      });

      const ids = adminIds.map(item => item.adminId);
      if (ids.length === 0) {
        return { data: [], total: 0, current: 1, pageSize: payload.pageSize || 10 };
      }

      const filters = { id: { [this.Op.in]: ids }, ...options.filters };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByRoles', { roleIds, payload, options });
    }
  }

  /**
   * 管理员登录验证
   * @param {String} identifier 登录标识（用户名、邮箱或手机号）
   * @param {String} password 密码
   * @param {String} loginType 登录类型
   * @return {Promise<Object|null>} 管理员信息
   */
  async verifyLogin(identifier, password, loginType) {
    try {
      let admin = null;

      switch (loginType) {
        case 'username':
          admin = await this.findByUserName(identifier, {
            fields: ['id', 'userName', 'password', 'status', 'nickName', 'userRoles'],
            includePassword: true,
          });
          break;
        case 'email':
          admin = await this.findByEmail(identifier, {
            fields: ['id', 'userName', 'password', 'status', 'nickName', 'userRoles'],
            includePassword: true,
          });
          break;
        case 'phone':
          admin = await this.findByPhone(identifier, {
            fields: ['id', 'userName', 'password', 'status', 'nickName', 'userRoles'],
            includePassword: true,
          });
          break;
        default:
          throw new Error('Invalid login type');
      }

      if (!admin) {
        throw this.exceptions.user.notFound();
      }

      if (admin.status !== SYSTEM_CONSTANTS.STATUS.ENABLED) {
        throw this.exceptions.user.disabled();
      }

      // 验证密码
      const isValidPassword = CryptoUtil.verifyPassword(password, admin.password, this.app.config.encrypt_key);
      if (!isValidPassword) {
        throw this.exceptions.user.invalidCredentials();
      }

      // 返回管理员信息（不包含密码）
      delete admin.password;
      return admin;
    } catch (error) {
      this._handleError(error, 'verifyLogin', { identifier, loginType });
    }
  }

  /**
   * 更新管理员密码
   * @param {String} adminId 管理员ID
   * @param {String} newPassword 新密码（明文）
   * @return {Promise<Object>} 更新结果
   */
  async updatePassword(adminId, newPassword) {
    // 🔥 直接传明文密码，让 AdminSchema 的 set 方法自动加密
    // 不要在这里手动加密，否则会导致密码被加密两次
    return await this.update(adminId, { password: newPassword });
  }

  /**
   * 获取管理员统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getAdminStats(filter = {}) {
    try {
      await this._ensureConnection();

      const stats = await this.model.findAll({
        where: filter,
        attributes: [
          'status',
          [this.connection.getSequelize().fn('COUNT', this.connection.getSequelize().col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      const result = {
        total: 0,
        enabled: 0,
        disabled: 0,
      };

      stats.forEach(item => {
        const count = parseInt(item.count);
        result.total += count;

        switch (item.status) {
          case SYSTEM_CONSTANTS.STATUS.ENABLED:
            result.enabled = count;
            break;
          case SYSTEM_CONSTANTS.STATUS.DISABLED:
            result.disabled = count;
            break;
        }
      });

      return result;
    } catch (error) {
      this._handleError(error, 'getAdminStats', { filter });
      return { total: 0, enabled: 0, disabled: 0 };
    }
  }

  /**
   * 批量更新管理员状态
   * @param {Array} adminIds 管理员ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async updateAdminStatus(adminIds, status) {
    try {
      const idArray = Array.isArray(adminIds) ? adminIds : [adminIds];
      return await this.updateStatus(idArray, status);
    } catch (error) {
      this._handleError(error, 'updateAdminStatus', { adminIds, status });
    }
  }

  /**
   * 添加角色到管理员
   * @param {String} adminId 管理员ID
   * @param {String|Array} roleIds 角色ID
   * @param options
   * @return {Promise<Object>} 更新结果
   */
  async addRoles(adminId, roleIds, options = {}) {
    await this._ensureConnection();
    try {
      const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
      const createBy = options.createBy || 'system';
      const relations = ids.map(roleId => ({
        adminId,
        roleId,
        status: SYSTEM_CONSTANTS.STATUS.ENABLED,
        createBy,
      }));
      const result = await this.adminRoleModel.bulkCreate(relations, { ignoreDuplicates: true });
      this._logOperation('addRoles', { adminId, roleIds }, result);
      return { success: true, added: result.length };
    } catch (error) {
      this._handleError(error, 'addRoles', { adminId, roleIds });
    }
  }

  /**
   * 移除管理员的角色
   * @param {String} adminId 管理员ID
   * @param {String|Array} roleIds 角色ID
   * @return {Promise<Object>} 更新结果
   */
  async removeRoles(adminId, roleIds) {
    await this._ensureConnection();
    try {
      const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
      const result = await this.adminRoleModel.destroy({
        where: { adminId, roleId: { [this.Op.in]: ids } },
      });
      this._logOperation('removeRoles', { adminId, roleIds }, result);
      return { success: true, removed: result };
    } catch (error) {
      this._handleError(error, 'removeRoles', { adminId, roleIds });
    }
  }

  /**
   * 获取管理员的角色信息
   * @param {String} adminId 管理员ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async getAdminRoles(adminId, options = {}) {
    await this._ensureConnection();
    try {
      const admin = await this.model.findByPk(adminId, {
        include: [
          {
            model: this.roleModel,
            as: 'userRoles',
            attributes: options.fields || ['id', 'roleName', 'roleCode', 'roleDesc', 'status', 'menus', 'buttons'],
            through: { attributes: [], where: { status: SYSTEM_CONSTANTS.STATUS.ENABLED } },
            where: { status: SYSTEM_CONSTANTS.STATUS.ENABLED },
          },
        ],
      });
      return admin ? admin.userRoles || [] : [];
    } catch (error) {
      this._handleError(error, 'getAdminRoles', { adminId, options });
    }
  }

  /**
   * 设置管理员的角色（替换现有角色）
   * @param {String} adminId 管理员ID
   * @param {Array} roleIds 角色ID数组
   * @param {Object} options 选项
   * @return {Promise<Object>} 操作结果
   */
  async setRoles(adminId, roleIds, options = {}) {
    await this._ensureConnection();
    const transaction = await this.connection.getSequelize().transaction();

    try {
      // 1. 删除现有关联
      await this.adminRoleModel.destroy({
        where: { adminId },
        transaction,
      });

      // 2. 创建新关联
      if (roleIds && roleIds.length > 0) {
        await this._createRoleRelations(adminId, roleIds, {
          transaction,
          createBy: options.createBy || 'system',
        });
      }

      await transaction.commit();
      this._logOperation('setRoles', { adminId, roleIds }, { success: true });
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      this._handleError(error, 'setRoles', { adminId, roleIds });
    }
  }

  // ===== 🔥 辅助方法 =====

  /**
   * 创建角色关联关系
   * @param {String} adminId 管理员ID
   * @param {Array} roleIds 角色ID数组
   * @param {Object} options 选项
   * @private
   */
  async _createRoleRelations(adminId, roleIds, options = {}) {
    const relations = roleIds.map(roleId => ({
      adminId,
      roleId,
      status: SYSTEM_CONSTANTS.STATUS.ENABLED,
      createBy: options.createBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return await this.adminRoleModel.bulkCreate(relations, {
      transaction: options.transaction,
      ignoreDuplicates: true,
    });
  }
}

module.exports = AdminMariaRepository;
