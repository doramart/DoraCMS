/**
 * MariaDB Repository 基类
 * 提供 MariaDB 特定的通用功能
 */
'use strict';

const BaseStandardRepository = require('./BaseStandardRepository');
const { Op } = require('sequelize');

class BaseMariaRepository extends BaseStandardRepository {
  constructor(ctx, entityName) {
    super(ctx, entityName);

    // 设置数据库类型为 MariaDB
    this.databaseType = 'mariadb';

    // 设置 Sequelize 操作符
    this.Op = Op;

    // 字段更新策略配置
    this.updateFieldStrategies = {
      // 核心必填字段 - 更新时需要完整验证
      required: [],
      // 可独立更新的字段 - 更新时可跳过其他字段验证
      independent: ['order', 'status', 'isEnable', 'enable', 'updatedAt', 'createdAt'],
      // 关联字段 - 更新时需要验证关联关系
      relational: [],
    };
  }

  // ===== 🔥 抽象方法 - 子类必须实现 =====

  /**
   * 确保数据库连接已建立
   * 子类必须实现此方法以初始化数据库连接和模型
   * @return {Promise<void>}
   * @protected
   * @abstract
   */
  async _ensureConnection() {
    throw new Error('_ensureConnection() must be implemented by subclass');
  }

  // ===== 🔥 通用方法 - 从 AdminMongoRepository 提取的常用模式 =====

  /**
   * 获取默认的关联查询配置
   * 子类应该重写此方法以提供特定的 populate 配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [];
  }

  /**
   * 获取默认的搜索字段
   * 子类应该重写此方法以提供特定的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return [];
  }

  /**
   * 获取默认的排序配置
   * 子类应该重写此方法以提供特定的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
  }

  /**
   * 获取状态映射
   * 子类可以重写此方法以提供特定的状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return {
      1: '启用',
      2: '禁用',
    };
  }

  /**
   * 获取实体的有效表字段列表（同步版本）
   * 🔥 优化版：自动从Sequelize模型获取字段，减少手动维护
   * 🔥 新增：缓存机制 + 日志记录 + 智能关联字段检测
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    // 🔥 新增：使用缓存（缓存有效期 5 分钟）
    const CACHE_TTL = 5 * 60 * 1000; // 5 分钟
    if (
      this._cachedValidFields &&
      this._cachedValidFieldsTimestamp &&
      Date.now() - this._cachedValidFieldsTimestamp < CACHE_TTL
    ) {
      this._logFieldDetection('using_cache', {
        fieldCount: this._cachedValidFields.length,
      });
      return this._cachedValidFields;
    }

    try {
      // 方案1：自动从Sequelize模型获取所有字段
      if (this.model && this.model.rawAttributes) {
        const modelFields = Object.keys(this.model.rawAttributes);

        // 🔥 新增：智能识别关联字段
        const associationFields = this._getAssociationFields();

        // 获取子类定义的额外字段（如果有）
        const additionalFields = this._getAdditionalTableFields();

        // 获取静态排除字段（向后兼容）
        const staticExcludeFields = this._getExcludeTableFields();

        // 🔥 新增：合并所有排除字段
        const allExcludeFields = [...new Set([...associationFields, ...staticExcludeFields])];

        // 合并字段并去重
        const allFields = [...new Set([...modelFields, ...additionalFields])];

        // 过滤掉需要排除的字段
        const validFields = allFields.filter(field => !allExcludeFields.includes(field));

        // 🔥 新增：缓存结果
        this._cachedValidFields = validFields;
        this._cachedValidFieldsTimestamp = Date.now();

        // 🔥 新增：记录成功日志
        this._logFieldDetection('auto_detect_success', {
          fieldCount: validFields.length,
          modelFieldCount: modelFields.length,
          associationFieldCount: associationFields.length,
          excludedFieldCount: allExcludeFields.length,
        });

        return validFields;
      }
    } catch (error) {
      // 🔥 优化：使用新的日志方法
      this._logFieldDetection('auto_detect_failed', {
        error: error.message,
        fallbackCount: this._getBaseTableFields().length + this._getSpecificTableFields().length,
      });
    }

    // 方案2：兜底方案 - 基础通用字段
    const baseFields = this._getBaseTableFields();
    const specificFields = this._getSpecificTableFields();
    const fallbackFields = [...baseFields, ...specificFields];

    // 🔥 新增：记录兜底方案日志
    this._logFieldDetection('using_fallback', {
      fallbackCount: fallbackFields.length,
      reason: 'model_not_initialized',
    });

    return fallbackFields;
  }

  /**
   * 获取基础通用字段（所有表都有的字段）
   * @return {Array} 基础字段列表
   * @protected
   */
  _getBaseTableFields() {
    return ['id', 'status', 'createBy', 'updateBy', 'createdAt', 'updatedAt'];
  }

  /**
   * 获取子类特定的表字段（子类重写）
   * @return {Array} 特定字段列表
   * @protected
   */
  _getSpecificTableFields() {
    return [];
  }

  /**
   * 获取需要额外添加的字段（子类可选重写）
   * @return {Array} 额外字段列表
   * @protected
   */
  _getAdditionalTableFields() {
    return [];
  }

  /**
   * 获取需要排除的字段（如关联字段、虚拟字段等）
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    return [
      // 常见的需要排除的字段
      'userRoles', // 关联字段
      'roles', // 关联字段
      'menus', // 关联字段
      'children', // 虚拟字段
      'parent', // 关联字段
    ];
  }

  /**
   * 🔥 新增：智能识别模型的关联字段
   * 自动从 Sequelize 模型的 associations 中提取关联字段名
   * @return {Array} 关联字段列表
   * @private
   */
  _getAssociationFields() {
    const associationFields = [];

    try {
      if (this.model && this.model.associations) {
        // 遍历所有关联关系
        Object.keys(this.model.associations).forEach(key => {
          const association = this.model.associations[key];

          // 添加关联字段名（as 属性）
          if (association.as) {
            associationFields.push(association.as);
          }

          // 🔥 HasMany/HasOne/BelongsToMany 的字段是虚拟字段，需要排除
          // BelongsTo 的外键字段是真实字段，不排除
          // if (
          //   association.associationType === 'HasMany' ||
          //   association.associationType === 'HasOne' ||
          //   association.associationType === 'BelongsToMany'
          // ) {
          //   // 这些关联类型的字段名是虚拟的
          // }
        });
      }
    } catch (error) {
      // 静默失败，不影响字段检测
      if (this.app?.config?.env === 'local') {
        this.app.logger.warn(`[${this.constructor.name}] Failed to detect association fields:`, error.message);
      }
    }

    // 添加通用的虚拟字段
    associationFields.push('children', 'parent', 'creator', 'updater');

    return [...new Set(associationFields)]; // 去重
  }

  /**
   * 🔥 新增：日志记录字段检测操作
   * 只在开发和本地环境记录详细日志
   * @param {string} action 操作类型
   * @param {Object} data 操作数据
   * @private
   */
  _logFieldDetection(action, data) {
    // 只在开发和本地环境记录详细日志
    if (!this.app || !this.app.config) {
      return; // 避免在没有 app 上下文时报错
    }

    const env = this.app.config.env;
    if (env !== 'local' && env !== 'development') {
      return; // 生产环境不记录详细日志
    }

    const logData = {
      repository: this.constructor.name,
      entityName: this.entityName,
      action,
      timestamp: new Date().toISOString(),
      ...data,
    };

    try {
      if (action === 'auto_detect_success') {
        this.app.logger.debug(`[FieldDetection] ✅ ${this.constructor.name}: Auto-detected ${data.fieldCount} fields`);
      } else if (action === 'auto_detect_failed') {
        this.app.logger.warn(
          `[FieldDetection] ⚠️ ${this.constructor.name}: Auto-detection failed, using fallback (${data.fallbackCount} fields)`,
          data.error || ''
        );
      } else if (action === 'using_cache') {
        this.app.logger.debug(
          `[FieldDetection] 🔄 ${this.constructor.name}: Using cached fields (${data.fieldCount} fields)`
        );
      } else if (action === 'using_fallback') {
        this.app.logger.debug(
          `[FieldDetection] 📋 ${this.constructor.name}: Using fallback (${data.fallbackCount} fields) - ${data.reason || 'unknown'}`
        );
      } else if (action === 'filtered_invalid_fields') {
        this.app.logger.warn(
          `[FieldDetection] ⚠️ ${this.constructor.name}: Filtered out ${data.filteredCount} invalid fields:`,
          data.filteredFields
        );
      }
    } catch (error) {
      // 静默失败，不影响主流程
    }
  }

  /**
   * 🔥 新增：异步版本 - 获取实体的有效表字段列表
   * 确保 model 在使用前已初始化
   * @return {Promise<Array>} 有效字段列表
   * @protected
   */
  async _getValidTableFieldsAsync() {
    // 🔥 关键：确保连接已建立，model 已初始化
    await this._ensureConnection();

    try {
      // 此时 this.model 一定已初始化
      if (this.model && this.model.rawAttributes) {
        const modelFields = Object.keys(this.model.rawAttributes);

        // 🔥 智能识别关联字段（新功能）
        const associationFields = this._getAssociationFields();

        // 获取子类定义的额外字段
        const additionalFields = this._getAdditionalTableFields();

        // 获取静态排除字段（向后兼容）
        const staticExcludeFields = this._getExcludeTableFields();

        // 合并所有排除字段
        const allExcludeFields = [...new Set([...associationFields, ...staticExcludeFields])];

        // 合并所有字段并去重
        const allFields = [...new Set([...modelFields, ...additionalFields])];

        // 过滤掉需要排除的字段
        const validFields = allFields.filter(field => !allExcludeFields.includes(field));

        // 🔥 缓存结果
        this._cachedValidFields = validFields;
        this._cachedValidFieldsTimestamp = Date.now();

        // 记录成功日志
        this._logFieldDetection('auto_detect_success', {
          fieldCount: validFields.length,
          modelFieldCount: modelFields.length,
          associationFieldCount: associationFields.length,
          excludedFieldCount: allExcludeFields.length,
        });

        return validFields;
      }
    } catch (error) {
      // 记录失败日志
      this._logFieldDetection('auto_detect_failed', {
        error: error.message,
        stack: error.stack,
      });
    }

    // 兜底方案
    const baseFields = this._getBaseTableFields();
    const specificFields = this._getSpecificTableFields();
    const fallbackFields = [...baseFields, ...specificFields];

    this._logFieldDetection('using_fallback', {
      fallbackCount: fallbackFields.length,
      reason: 'model_not_initialized_or_error',
    });

    return fallbackFields;
  }

  /**
   * 深度转换 Sequelize 实例为纯 JavaScript 对象
   * 通用化的深度转换方法，支持所有模型类型
   * @param {Object} instance Sequelize 实例
   * @return {Object} 纯 JavaScript 对象
   * @protected
   */
  _deepToJSON(instance) {
    if (!instance) return null;

    // 如果是数组，递归处理每个元素
    if (Array.isArray(instance)) {
      return instance.map(item => this._deepToJSON(item));
    }

    // 如果是 Sequelize 实例，特殊处理
    if (instance.toJSON && typeof instance.toJSON === 'function' && instance.constructor.name !== 'Object') {
      // 先调用实例的 toJSON 方法
      const json = instance.toJSON();

      // 🔥 通用处理：确保所有 JSON 字段的 getter 被正确调用
      // 检查模型是否有自定义的 JSON 字段处理需求
      if (instance.get && typeof instance.get === 'function') {
        try {
          // 调用子类的自定义 JSON 字段处理方法
          this._processCustomJsonFields(instance, json);
        } catch (error) {
          console.warn(`Error processing custom JSON fields for ${instance.constructor.name}:`, error.message);
        }
      }

      // 递归处理所有属性，确保嵌套的关联对象也被转换
      for (const key in json) {
        if (json[key] && typeof json[key] === 'object') {
          json[key] = this._deepToJSON(json[key]);
        }
      }

      return json;
    }

    // 如果是普通对象，递归处理其属性
    if (typeof instance === 'object' && instance !== null) {
      const result = {};
      for (const key in instance) {
        if (instance.hasOwnProperty(key)) {
          result[key] = this._deepToJSON(instance[key]);
        }
      }
      return result;
    }

    // 基本类型直接返回
    return instance;
  }

  /**
   * 处理自定义 JSON 字段
   * 子类可以重写此方法来处理特定模型的 JSON 字段
   * @param {Object} instance Sequelize 实例
   * @param {Object} json 转换后的 JSON 对象
   * @protected
   */
  _processCustomJsonFields(instance, json) {
    // 默认实现：检查常见的 JSON 字段
    const jsonFields = ['menus', 'buttons', 'permissions', 'config', 'settings'];

    jsonFields.forEach(field => {
      if (instance.rawAttributes && instance.rawAttributes[field]) {
        try {
          const value = instance.get(field);
          if (value !== undefined) {
            json[field] = value;
          }
        } catch (error) {
          // 忽略获取失败的字段
        }
      }
    });
  }

  /**
   * 判断字段是否应该被包含在结果中
   * @param {string} fieldName 字段名
   * @param {Object} options 查询选项
   * @return {boolean} 是否应该包含该字段
   * @protected
   */
  _shouldIncludeField(fieldName, options = {}) {
    const fields = options.fields;

    // 如果没有指定 fields，按默认逻辑处理
    if (!fields) {
      return false;
    }

    // fields 只支持数组格式：['name', 'email', 'password']
    if (Array.isArray(fields)) {
      return fields.includes(fieldName);
    }

    return false;
  }

  /**
   * 子类自定义的数据项处理
   * 子类可以重写此方法以添加特定的数据处理逻辑
   * @param {Object} item 预处理后的数据项
   * @param {Object} options 查询选项（包含 fields 等信息）
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 添加状态文本
    if (item.status) {
      const statusMapping = this._getStatusMapping();
      item.statusText = statusMapping[item.status] || '未知';
    }

    return item;
  }

  /**
   * 子类自定义的创建前数据处理
   * 子类可以重写此方法以添加特定的创建前处理逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 只在 Schema 中定义了 status 字段时才设置默认值
    if (this.model && this.model.rawAttributes && this.model.rawAttributes.status) {
      if (!data.status) data.status = '1';
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理
   * 子类可以重写此方法以添加特定的更新前处理逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    return data;
  }

  /**
   * 验证和过滤查询字段（同步版本 - 向后兼容）
   * 确保只包含有效的表字段，排除关联字段
   * @param {Object} queryOptions Sequelize 查询选项
   * @protected
   */
  _validateAndFilterQueryFields(queryOptions) {
    if (queryOptions.attributes && Array.isArray(queryOptions.attributes)) {
      const requestedAttrs = [...queryOptions.attributes]; // 保存原始请求
      const validAttributes = this._getValidTableFields();
      queryOptions.attributes = queryOptions.attributes.filter(attr => validAttributes.includes(attr));

      // 🔥 新增：记录被过滤的字段
      const filteredAttrs = requestedAttrs.filter(attr => !validAttributes.includes(attr));
      if (filteredAttrs.length > 0) {
        this._logFieldDetection('filtered_invalid_fields', {
          filteredCount: filteredAttrs.length,
          filteredFields: filteredAttrs,
        });
      }

      // 如果没有有效字段，则不限制字段
      if (queryOptions.attributes.length === 0) {
        delete queryOptions.attributes;
      }
    }
  }

  /**
   * 🔥 新增：验证和过滤查询字段（异步版本 - 推荐）
   * 确保只包含有效的表字段，排除关联字段
   * @param {Object} queryOptions Sequelize 查询选项
   * @return {Promise<void>}
   * @protected
   */
  async _validateAndFilterQueryFieldsAsync(queryOptions) {
    if (queryOptions.attributes && Array.isArray(queryOptions.attributes)) {
      const requestedAttrs = [...queryOptions.attributes]; // 保存原始请求

      // 🔥 使用异步版本获取字段
      const validAttributes = await this._getValidTableFieldsAsync();
      queryOptions.attributes = queryOptions.attributes.filter(attr => validAttributes.includes(attr));

      // 🔥 记录被过滤的字段
      const filteredAttrs = requestedAttrs.filter(attr => !validAttributes.includes(attr));
      if (filteredAttrs.length > 0) {
        this._logFieldDetection('filtered_invalid_fields', {
          filteredCount: filteredAttrs.length,
          filteredFields: filteredAttrs,
        });
      }

      // 如果没有有效字段，则不限制字段
      if (queryOptions.attributes.length === 0) {
        delete queryOptions.attributes;
      }
    }
  }

  /**
   * 重写基类的 _processResult 方法，使用优化后的深度 JSON 转换
   * @param {*} result 查询结果
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项（包含 fields 等信息）
   * @return {*} 处理后的结果
   * @protected
   */
  _processResult(result, payload = {}, options = {}) {
    // 🔥 使用优化后的深度转换代替原始的 toJSON
    const transformedResult = this._transformMariaResultWithDeepJSON(result, options);

    // 如果是分页查询，补充分页信息
    if (payload.isPaging && transformedResult && transformedResult.docs) {
      const pageInfo = transformedResult.pageInfo || {};

      // 补充分页信息
      Object.assign(pageInfo, {
        totalItems: Number(result.count),
        pageSize: Number(payload.pageSize || 10),
        current: Number(payload.current || payload.page || 1),
        searchkey: payload.searchkey || '',
        totalPage: Math.ceil(Number(result.count) / Number(payload.pageSize || 10)),
      });

      // 添加查询条件到分页信息（保持向后兼容）
      if (payload.query) {
        Object.keys(payload.query).forEach(key => {
          if (typeof payload.query[key] !== 'object') {
            pageInfo[key] = payload.query[key] || '';
          }
        });
      }

      transformedResult.pageInfo = pageInfo;
      delete transformedResult.count;

      // 🔥 如果有搜索关键词且有搜索上下文，生成搜索摘要（重要！）
      if (payload.searchkey && this._searchContext && transformedResult.docs && transformedResult.docs.length > 0) {
        try {
          transformedResult.docs = this._generateSearchSnippets(transformedResult.docs, options);
        } catch (error) {
          console.warn('[BaseMariaRepository] Error generating search snippets:', error.message);
          // 继续返回原始结果，不因为摘要生成失败而中断
        }
      }
    }

    return transformedResult;
  }

  /**
   * 使用优化后的深度 JSON 转换处理 MariaDB 结果
   * @param {*} result MariaDB 查询结果
   * @param {Object} options 查询选项（包含 fields 等信息）
   * @return {*} 转换后的结果
   * @private
   */
  _transformMariaResultWithDeepJSON(result, options = {}) {
    // 🔥 使用优化后的 _deepToJSON 替代原始的 toJSON
    if (Array.isArray(result)) {
      return result.map(item => {
        const processed = this._deepToJSON(item);
        return this._customProcessDataItem(processed, options);
      });
    }

    if (result && result.docs) {
      // 分页结果
      const processedDocs = result.docs.map(item => {
        const processed = this._deepToJSON(item);
        return this._customProcessDataItem(processed, options);
      });

      // 🔥 如果存在搜索上下文，为结果生成关键词摘要
      if (this._searchContext && options.generateSnippets !== false) {
        // 搜索摘要生成已移到基类的 _processResult 方法中
      }

      return {
        docs: processedDocs,
        pageInfo: result.pageInfo,
      };
    }

    // 单个结果
    const processed = this._deepToJSON(result);
    return this._customProcessDataItem(processed, options);
  }

  // ===== 🔥 通用 CRUD 方法 - 提供默认实现，子类可重写 =====

  /**
   * 通用的 findOne 方法
   * 提供默认实现，子类可以重写以添加特定逻辑
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(query = {}, options = {}) {
    try {
      await this._ensureConnection();

      // 标准化参数并转换为 MariaDB 格式
      const standardParams = this._standardizeParams(
        {}, // 空的 payload
        {
          filters: query,
          populate: options.populate || this._getDefaultPopulate(),
          fields: options.fields,
          pagination: { isPaging: false },
        }
      );

      // 构建查询选项
      const queryOptions = await this._buildQueryOptions(standardParams);

      // 🔥 处理搜索条件 - 支持 searchkey 和 keyword 参数 (findOne)
      if ((query.searchkey || query.keyword) && (options.searchKeys || this._getDefaultSearchKeys().length > 0)) {
        const searchKey = query.searchkey || query.keyword;
        const searchKeys = options.searchKeys || this._getDefaultSearchKeys();
        const searchCondition = this._buildSearchCondition(searchKey, searchKeys, {
          debug: options.debug || query.debug || false,
        });

        if (!this._isEmptyObject(searchCondition)) {
          queryOptions.where = {
            ...queryOptions.where,
            ...searchCondition,
          };
        }
      }

      // 🔥 优化：使用异步版本验证和过滤查询字段（确保 model 已初始化）
      await this._validateAndFilterQueryFieldsAsync(queryOptions);

      // 设置默认字段选择
      if (!queryOptions.attributes && !options.includePassword) {
        queryOptions.attributes = { exclude: ['password'] };
      }

      // 执行查询
      const result = await this.model.findOne(queryOptions);

      // 处理结果 - 使用统一的结果转换逻辑
      const processedResult = result ? this._transformMariaResultWithDeepJSON(result, options) : null;

      // 记录操作日志
      this._logOperation('findOne', query, processedResult);

      return processedResult;
    } catch (error) {
      this._handleError(error, 'findOne', { query, options });
    }
  }

  /**
   * 通用的 find 方法
   * 提供默认实现，保持与原有逻辑兼容
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async find(payload = {}, options = {}) {
    try {
      await this._ensureConnection();

      // 标准化参数并转换为 MariaDB 格式
      const standardParams = this._standardizeParams(payload, {
        filters: options.filters || options.query || {},
        populate: options.populate || this._getDefaultPopulate(),
        fields: options.fields,
        sort: options.sort || this._getDefaultSort(),
      });

      // 构建查询选项
      const queryOptions = await this._buildQueryOptions(standardParams);

      // 🔥 处理搜索条件 - 支持 searchkey 和 keyword 参数
      if ((payload.searchkey || payload.keyword) && (options.searchKeys || this._getDefaultSearchKeys().length > 0)) {
        const searchKey = payload.searchkey || payload.keyword;
        const searchKeys = options.searchKeys || this._getDefaultSearchKeys();
        const searchCondition = this._buildSearchCondition(searchKey, searchKeys, {
          debug: options.debug || payload.debug || false,
        });

        if (!this._isEmptyObject(searchCondition)) {
          queryOptions.where = {
            ...queryOptions.where,
            ...searchCondition,
          };
        }
      }

      // 🔥 优化：使用异步版本验证和过滤查询字段（确保 model 已初始化）
      await this._validateAndFilterQueryFieldsAsync(queryOptions);

      // 设置默认字段选择
      if (!queryOptions.attributes && !options.includePassword) {
        queryOptions.attributes = { exclude: ['password'] };
      }

      // 🔥 根据是否分页决定查询方式（修复 include 关联查询时 count 不准确的问题）
      let result;
      const { pagination } = standardParams;
      if (pagination.isPaging) {
        // 🔥 修复：当存在 include 关联查询时，使用 distinct: true 避免重复计数
        const hasIncludes = queryOptions.include && queryOptions.include.length > 0;

        if (hasIncludes) {
          // 检查是否有多对多关联（belongsToMany），这种关联最容易导致重复计数
          const hasManyToManyIncludes = queryOptions.include.some(include => {
            const association = this.model.associations && this.model.associations[include.as];
            return (
              association &&
              (association.associationType === 'BelongsToMany' || association.associationType === 'HasMany')
            );
          });

          if (hasManyToManyIncludes) {
            // 🔥 修复：对于多对多关联，使用 distinct 查询避免重复计数
            queryOptions.distinct = true;

            // 🔥 优化：让 Sequelize 自动处理主键列的选择
            // 不指定 col 参数，Sequelize 会自动使用模型的主键进行 distinct
            // 这样避免了手动获取表名可能出现的错误

            console.log(`🔍 [${this.entityName}] 检测到多对多关联查询，启用 distinct 计数优化`);
          }
        }

        const { count, rows } = await this.model.findAndCountAll(queryOptions);
        result = {
          docs: rows,
          count,
        };
      } else {
        result = await this.model.findAll(queryOptions);
      }

      // 🔥 使用 _processResult 处理结果（保持原有数据转换逻辑）
      const processedResult = this._processResult(
        result,
        {
          ...pagination,
          ...payload,
        },
        options
      );

      // 记录操作日志
      this._logOperation('find', { payload, options }, processedResult);

      return processedResult;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  /**
   * 通用的 create 方法
   * 提供默认实现，子类可以重写以添加特定逻辑
   * @param {Object} data 创建数据
   * @return {Promise<Object>} 创建结果
   */
  async create(data) {
    await this._ensureConnection();
    const transaction = await this.connection.getSequelize().transaction();

    try {
      // 应用自定义预处理
      const processedData = this._customPreprocessForCreate(data);

      const result = await this.model.create(processedData, { transaction });

      await transaction.commit();

      // 获取完整数据（包含关联）
      const fullResult = await this.findById(result.id, {
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('create', { data }, fullResult);
      return fullResult;
    } catch (error) {
      await transaction.rollback();
      this._handleError(error, 'create', { data });
    }
  }

  /**
   * 通用的 update 方法
   * 提供默认实现，子类可以重写以添加特定逻辑
   * @param {String|Number} id 记录ID
   * @param {Object} data 更新数据
   * @param options
   * @return {Promise<Object>} 更新结果
   */
  async update(id, data, options = {}) {
    await this._ensureConnection();

    try {
      const { $inc, ...restData } = data || {};

      // 应用自定义预处理
      const processedData = this._customPreprocessForUpdate(restData);

      const transaction = await this.connection.getSequelize().transaction();
      try {
        // 处理自增更新（兼容 Mongo 风格的 $inc）
        if ($inc && typeof $inc === 'object' && Object.keys($inc).length > 0) {
          await this.model.increment($inc, { where: { id }, transaction });
        }

        // 处理常规字段更新
        if (processedData && Object.keys(processedData).length > 0) {
          // 合并选项，支持跳过验证
          const updateOptions = {
            where: { id },
            transaction,
            validate: options.validate !== false, // 默认验证，除非明确设置为 false
          };
          await this.model.update(processedData, updateOptions);
        }

        await transaction.commit();
      } catch (innerError) {
        await transaction.rollback();
        throw innerError;
      }

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
   * 通用的根据ID查找方法
   * @param {String|Number} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findById(id, options = {}) {
    return await this.findOne({ id }, options);
  }

  /**
   * 通用的根据ID删除方法
   * @param {String|Number} ids 记录ID
   * @param {String} key 主键字段名，默认为 'id'
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    try {
      // 确保数据库连接和模型已初始化
      await this._ensureConnection();

      const idArray = Array.isArray(ids) ? ids : [ids];
      return await this.model.destroy({ where: { [key]: { [this.Op.in]: idArray } } });
    } catch (error) {
      this._handleError(error, 'remove', { ids, key });
    }
  }

  /**
   * 统计记录数量
   * @param {Object} query 查询条件
   * @return {Promise<Number>} 记录数量
   */
  async count(query = {}) {
    try {
      await this._ensureConnection();

      // 标准化查询条件
      const standardParams = this._standardizeParams({}, { filters: query });

      // 构建查询选项
      const queryOptions = await this._buildQueryOptions(standardParams);

      // 执行统计
      const result = await this.model.count(queryOptions);

      // 记录操作日志
      this._logOperation('count', query, result);

      return result;
    } catch (error) {
      this._handleError(error, 'count', query);
    }
  }

  /**
   * 软删除记录（标记删除）
   * @param {String|Array} ids 要删除的记录ID或ID数组
   * @param {Object} updateObj 更新对象，默认 { status: '0' }
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { status: '0' }) {
    try {
      await this._ensureConnection();

      const idArray = Array.isArray(ids) ? ids : [ids];
      const transaction = await this.connection.getSequelize().transaction();

      try {
        // 添加更新时间
        const updateData = {
          ...updateObj,
          updatedAt: new Date(),
        };

        // 执行软删除更新
        const [affectedCount] = await this.model.update(updateData, {
          where: { id: { [this.Op.in]: idArray } },
          transaction,
        });

        await transaction.commit();

        // 记录操作日志
        this._logOperation('safeDelete', { ids, updateObj }, { affectedCount });

        return { success: true, affectedCount };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this._handleError(error, 'safeDelete', { ids, updateObj });
    }
  }

  /**
   * 通用的根据状态查找方法
   * @param {String} status 状态
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByStatus(status, payload = {}, options = {}) {
    try {
      const filters = { status, ...options.filters };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByStatus', { status, payload, options });
    }
  }

  /**
   * 批量更新状态
   * @param {Array} ids ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async updateStatus(ids, status) {
    try {
      await this._ensureConnection();
      const idArray = Array.isArray(ids) ? ids : [ids];

      const [affectedCount] = await this.model.update(
        { status, updatedAt: new Date() },
        { where: { id: { [this.Op.in]: idArray } } }
      );

      return { affectedCount };
    } catch (error) {
      this._handleError(error, 'updateStatus', { ids, status });
    }
  }

  /**
   * 构建 MariaDB Sequelize 查询选项
   * @param {Object} mariadbOptions 标准化后的 MariaDB 参数
   * @return {Object} Sequelize 查询选项
   * @protected
   */
  async _buildQueryOptions(mariadbOptions) {
    const options = {};

    // 处理 where 条件，分离关联字段和主表字段
    if (mariadbOptions.where) {
      const { relationFilters, mainFilters } = this._separateRelationFilters(mariadbOptions.where);

      // 设置主表查询条件
      if (Object.keys(mainFilters).length > 0) {
        options.where = mainFilters;
      }

      // 处理关联字段过滤条件
      if (Object.keys(relationFilters).length > 0) {
        options.where = {
          ...options.where,
          ...this._buildRelationFilters(relationFilters),
        };
      }
    }

    // 处理 include - 标准 Sequelize 关联查询
    if (mariadbOptions.include && mariadbOptions.include.length > 0) {
      options.include = mariadbOptions.include;
    }

    if (mariadbOptions.order && mariadbOptions.order.length > 0) {
      options.order = mariadbOptions.order;
    }

    if (mariadbOptions.attributes && mariadbOptions.attributes.length > 0) {
      options.attributes = mariadbOptions.attributes;
    }

    // 构建分页条件
    if (mariadbOptions.pagination && mariadbOptions.pagination.isPaging) {
      options.limit = mariadbOptions.pagination.pageSize;
      options.offset = (mariadbOptions.pagination.page - 1) * mariadbOptions.pagination.pageSize;
    } else if (mariadbOptions.pagination && mariadbOptions.pagination.pageSize) {
      // 如果不分页但设置了pageSize，则限制返回前pageSize条数据
      options.limit = mariadbOptions.pagination.pageSize;
    }

    return options;
  }

  /**
   * 分离关联字段和主表字段的过滤条件
   * @param {Object} where 查询条件
   * @return {Object} 分离后的条件对象
   * @protected
   */
  _separateRelationFilters(where) {
    const relationFilters = {};
    const mainFilters = {};

    // 获取已注册的关联关系
    const relationFields = this._getRegisteredRelations();

    Object.entries(where).forEach(([field, condition]) => {
      if (relationFields.includes(field)) {
        relationFilters[field] = condition;
      } else {
        mainFilters[field] = condition;
      }
    });

    return { relationFilters, mainFilters };
  }

  /**
   * 构建关联字段的过滤条件
   * @param {Object} relationFilters 关联字段过滤条件
   * @return {Object} Sequelize 子查询条件
   * @protected
   */
  _buildRelationFilters(relationFilters) {
    const conditions = {};

    Object.entries(relationFilters).forEach(([relationField, condition]) => {
      const relationConfig = this._getRelationConfig(relationField);

      if (relationConfig && relationConfig.type === 'belongsToMany') {
        // 对于 belongsToMany 关系，使用子查询
        const subQuery = this._buildBelongsToManySubQuery(relationConfig, condition);
        conditions.id = { [this.Op.in]: subQuery };
      } else if (relationConfig && relationConfig.type === 'belongsTo') {
        // 对于 belongsTo 关系，直接使用外键查询
        conditions[relationConfig.foreignKey] = condition;
      }
    });

    return conditions;
  }

  /**
   * 构建 BelongsToMany 关系的子查询
   * @param {Object} relationConfig 关联配置
   * @param {*} condition 查询条件
   * @return {Object} Sequelize 子查询
   * @protected
   */
  _buildBelongsToManySubQuery(relationConfig, condition) {
    const { through, foreignKey, otherKey } = relationConfig;

    return this.connection.getSequelize().literal(`(
      SELECT ${foreignKey} 
      FROM ${through} 
      WHERE ${otherKey} = ${typeof condition === 'string' ? `'${condition}'` : condition}
    )`);
  }

  /**
   * 获取已注册的关联关系字段列表
   * @return {Array} 关联字段列表
   * @protected
   */
  _getRegisteredRelations() {
    // 从 transformer 的模型注册中获取关联关系
    const modelConfig = this.transformer?.modelRegistry?.get(this.entityName);
    if (!modelConfig || !modelConfig.relations) {
      return [];
    }

    return Object.keys(modelConfig.relations);
  }

  /**
   * 获取关联关系配置
   * @param {String} relationField 关联字段名
   * @return {Object|null} 关联配置
   * @protected
   */
  _getRelationConfig(relationField) {
    const modelConfig = this.transformer?.modelRegistry?.get(this.entityName);
    if (!modelConfig || !modelConfig.relations) {
      return null;
    }

    return modelConfig.relations[relationField];
  }

  /**
   * 构建数据库特定的搜索条件 - MariaDB版本（Sequelize）
   * @param {Object} searchVariants 搜索变体
   * @param {Array} searchKeys 搜索字段
   * @param {Object} options 搜索选项
   * @return {Object} MariaDB搜索条件
   * @protected
   */
  _buildDatabaseSpecificSearchConditions(searchVariants, searchKeys, options = {}) {
    const conditions = [];
    const { original, words, phrases, combinations } = searchVariants;

    // 定义字段权重（标题字段权重更高）
    const fieldPriority = {
      title: 3, // 最高优先级
      stitle: 2, // 副标题
      discription: 1, // 描述
      comments: 1, // 评论
      keywords: 2, // 关键词字段
    };

    searchKeys.forEach(field => {
      const priority = fieldPriority[field] || 1;

      // 1. 完整匹配（最高权重）
      if (original) {
        conditions.push({
          [field]: { [this.Op.like]: `%${original}%` },
        });

        // 精确匹配（针对短关键词）
        if (original.length <= 10) {
          conditions.push({
            [field]: { [this.Op.like]: `% ${original} %` },
          });
        }
      }

      // 2. 短语匹配（高权重）
      phrases.forEach(phrase => {
        conditions.push({
          [field]: { [this.Op.like]: `%${phrase}%` },
        });
      });

      // 3. 单词匹配（中等权重）
      words.forEach(word => {
        if (word.length >= 2) {
          // 保留长度>=2的词（包括常见的英文短词如 js, ui, go 等）
          conditions.push({
            [field]: { [this.Op.like]: `%${word}%` },
          });
        }
      });

      // 4. 技术变体匹配（中等权重）
      combinations.forEach(variant => {
        conditions.push({
          [field]: { [this.Op.like]: `%${variant}%` },
        });
      });

      // 5. 高优先级字段的开头匹配
      if (priority >= 2 && original) {
        conditions.push({
          [field]: { [this.Op.like]: `${original}%` },
        });
      }
    });

    return conditions.length > 0 ? { [this.Op.or]: conditions } : {};
  }

  /**
   * 检查搜索条件是否为空 - MariaDB特定实现
   * @param {Object} conditions 搜索条件
   * @return {Boolean} 是否为空
   * @protected
   */
  _isEmptySearchCondition(conditions) {
    if (!conditions || typeof conditions !== 'object') {
      return true;
    }

    // 检查 Sequelize Op.or 结构
    if (conditions[this.Op.or]) {
      return !Array.isArray(conditions[this.Op.or]) || conditions[this.Op.or].length === 0;
    }

    return Object.keys(conditions).length === 0 && Object.getOwnPropertySymbols(conditions).length === 0;
  }

  /**
   * 检查对象是否为空（支持 Symbol 键）
   * @param {Object} obj 要检查的对象
   * @return {Boolean} 是否为空对象
   * @protected
   */
  _isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && Object.getOwnPropertySymbols(obj).length === 0;
  }

  /**
   * 标准化查询条件
   * @param {Object} filters 过滤条件
   * @return {Object} 标准化后的查询条件
   * @protected
   */
  _normalizeFilters(filters = {}) {
    const where = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // 处理特殊查询条件
        if (key === 'ids' && Array.isArray(value)) {
          where.id = { [this.Op.in]: value };
        } else if (key === 'enable' && typeof value === 'boolean') {
          where.enable = this._convertBooleanForMariaDB(value);
        } else {
          // 🔥 修复：处理 MongoDB 风格的操作符
          where[key] = this._convertMongoOperators(value);
        }
      }
    });

    return where;
  }

  /**
   * 将布尔值转换为 MariaDB 兼容的数值
   * @param {*} value 要转换的值
   * @return {*} 转换后的值
   * @protected
   */
  _convertBooleanForMariaDB(value) {
    // 如果是布尔值，转换为 0 或 1
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    // 如果是字符串形式的布尔值，也进行转换
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        return 1;
      } else if (value.toLowerCase() === 'false') {
        return 0;
      }
    }

    // 其他类型的值保持不变
    return value;
  }

  /**
   * 转换 MongoDB 风格的操作符为 Sequelize 格式
   * @param {*} value 要转换的值
   * @return {*} 转换后的值
   * @protected
   */
  _convertMongoOperators(value) {
    // 如果不是对象，直接进行布尔值转换
    if (typeof value !== 'object' || value === null) {
      return this._convertBooleanForMariaDB(value);
    }

    // 处理 MongoDB 操作符
    if (value.$eq !== undefined) {
      return this._convertBooleanForMariaDB(value.$eq);
    }
    if (value.$ne !== undefined) {
      return { [this.Op.ne]: this._convertBooleanForMariaDB(value.$ne) };
    }
    if (value.$gt !== undefined) {
      return { [this.Op.gt]: value.$gt };
    }
    if (value.$gte !== undefined) {
      return { [this.Op.gte]: value.$gte };
    }
    if (value.$lt !== undefined) {
      return { [this.Op.lt]: value.$lt };
    }
    if (value.$lte !== undefined) {
      return { [this.Op.lte]: value.$lte };
    }
    if (value.$in !== undefined) {
      return { [this.Op.in]: value.$in };
    }
    if (value.$nin !== undefined) {
      return { [this.Op.notIn]: value.$nin };
    }
    if (value.$regex !== undefined) {
      return { [this.Op.regexp]: value.$regex };
    }
    if (value.$like !== undefined) {
      return { [this.Op.like]: value.$like };
    }
    if (value.$contains !== undefined) {
      return { [this.Op.like]: `%${value.$contains}%` };
    }

    // 如果没有匹配的操作符，直接进行布尔值转换
    return this._convertBooleanForMariaDB(value);
  }

  /**
   * 验证查询参数的有效性
   * @param {Object} query 查询条件
   * @throws {Error} 当查询参数无效时抛出错误
   * @protected
   */
  _validateQueryParams(query = {}) {
    // 检查关键字段的值是否有效
    Object.entries(query).forEach(([key, value]) => {
      if (key === 'id' || key === 'id') {
        if (value === undefined || value === null) {
          throw new Error(`Invalid ID value: ${value}. ID cannot be null or undefined.`);
        }

        // 如果是复杂查询条件，检查内部值
        if (typeof value === 'object' && !Array.isArray(value)) {
          Object.entries(value).forEach(([operator, operatorValue]) => {
            if (operatorValue === undefined || operatorValue === null) {
              throw new Error(`Invalid value for ${operator} operator on ${key}: ${operatorValue}`);
            }
          });
        }
      }
    });
  }

  /**
   * 配置字段更新策略
   * @param {Object} strategies 字段策略配置
   * @protected
   */
  configureUpdateStrategies(strategies) {
    this.updateFieldStrategies = {
      ...this.updateFieldStrategies,
      ...strategies,
    };
  }

  /**
   * 智能判断更新类型和验证策略
   * @param {Object} updateData 要更新的数据
   * @return {Object} 更新策略信息
   * @protected
   */
  _analyzeUpdateStrategy(updateData) {
    const updateFields = Object.keys(updateData);
    const { required, independent, relational } = this.updateFieldStrategies;

    const analysis = {
      hasRequiredFields: updateFields.some(field => required.includes(field)),
      hasOnlyIndependentFields: updateFields.every(field => independent.includes(field) || field === 'updatedAt'),
      hasRelationalFields: updateFields.some(field => relational.includes(field)),
      updateFields,
      shouldSkipValidation: false,
      updateType: 'full', // 'partial' | 'full' | 'relational'
    };

    // 确定更新类型和验证策略
    if (analysis.hasOnlyIndependentFields && !analysis.hasRequiredFields) {
      analysis.updateType = 'partial';
      analysis.shouldSkipValidation = true;
    } else if (analysis.hasRelationalFields) {
      analysis.updateType = 'relational';
      analysis.shouldSkipValidation = false;
    } else {
      analysis.updateType = 'full';
      analysis.shouldSkipValidation = false;
    }

    return analysis;
  }

  /**
   * 通用的智能更新方法
   * @param {String|Number} id 记录ID
   * @param {Object} updateData 更新数据
   * @param {Object} options 更新选项
   * @return {Promise<Object>} 更新结果
   * @protected
   */
  async smartUpdate(id, updateData, options = {}) {
    // 分析更新策略
    const strategy = this._analyzeUpdateStrategy(updateData);

    // 预处理数据
    const processedData = this._preprocessDataForUpdate(updateData);

    // 构建更新选项
    const updateOptions = {
      where: { id },
      returning: true,
      ...options,
    };

    // 根据策略决定是否跳过验证
    if (options.forceValidation === false || strategy.shouldSkipValidation) {
      updateOptions.validate = false;
    }

    // 记录更新策略（调试用）
    if (this.app.config.repository?.logging) {
      console.log(`[${this.entityName}] Update strategy:`, {
        updateType: strategy.updateType,
        shouldSkipValidation: strategy.shouldSkipValidation,
        updateFields: strategy.updateFields,
      });
    }

    return { processedData, updateOptions, strategy };
  }

  /**
   * 批量智能更新方法
   * @param {Array} ids 记录ID数组
   * @param {Object} updateData 更新数据
   * @param {Object} options 更新选项
   * @return {Promise<Object>} 更新结果
   * @protected
   */
  async smartBatchUpdate(ids, updateData, options = {}) {
    // 分析更新策略
    const strategy = this._analyzeUpdateStrategy(updateData);

    // 预处理数据
    const processedData = this._preprocessDataForUpdate(updateData);

    // 构建更新选项
    const updateOptions = {
      where: { id: { [this.Op.in]: ids } },
      ...options,
    };

    // 根据策略决定是否跳过验证
    if (options.forceValidation === false || strategy.shouldSkipValidation) {
      updateOptions.validate = false;
    }

    return { processedData, updateOptions, strategy };
  }
}

module.exports = BaseMariaRepository;
