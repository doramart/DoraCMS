/**
 * 标准化基础 Repository 类
 * 提供统一的参数处理和转换功能
 */
'use strict';

const IBaseRepository = require('../interfaces/IBaseRepository');
const EnhancedDataTransformer = require('../utils/EnhancedDataTransformer');
const { StandardParamsValidator } = require('../interfaces/IStandardParams');
const RepositoryExceptions = require('./RepositoryExceptions');

class BaseStandardRepository extends IBaseRepository {
  constructor(ctx, entityName) {
    super();
    this.ctx = ctx;
    this.app = ctx.app;
    this.entityName = entityName;

    // 初始化转换器和验证器
    this.transformer = new EnhancedDataTransformer(this.app);
    this.validator = new StandardParamsValidator();

    // 数据库类型
    this.databaseType = this.app.config.repository?.databaseType || 'mongodb';

    // 模型实例（由子类设置）
    this.model = null;

    // 异常管理器 - 提供便捷的异常创建方法
    this.exceptions = RepositoryExceptions;
  }

  /**
   * 注册模型和关联关系
   * 子类应该在构造函数中调用此方法
   * @param {Object} modelConfig 模型配置
   */
  registerModel(modelConfig) {
    this.transformer.registerModel(this.entityName, modelConfig);

    // 注册关联关系
    if (modelConfig.relations) {
      Object.entries(modelConfig.relations).forEach(([path, config]) => {
        this.transformer.registerRelation(this.entityName, path, config);
      });
    }
  }

  /**
   * 🔥 规范化 ID：根据当前 Repository 的数据库类型自动转换 ID 类型
   * @param {string|number|Array} id - 待规范化的 ID
   * @return {string|number|Array} 规范化后的 ID
   * @description
   * - MariaDB: 将纯数字字符串转换为 number
   * - MongoDB: 保持 string 类型
   * - 支持数组批量转换
   */
  normalizeId(id) {
    if (!id && id !== 0) {
      return id;
    }

    // 处理数组情况
    if (Array.isArray(id)) {
      return id.map(singleId => this.normalizeId(singleId));
    }

    if (this.databaseType === 'mariadb') {
      // MariaDB 模式：转换为数字
      const idStr = String(id);
      // 只有纯数字才转换，否则可能是 shortId
      if (/^\d+$/.test(idStr)) {
        return parseInt(idStr, 10);
      }
    }

    // MongoDB 模式或非纯数字 ID：保持字符串
    return String(id);
  }

  /**
   * 🔥 类型安全的 ID 比较
   * @param {string|number} id1 - 第一个 ID
   * @param {string|number} id2 - 第二个 ID
   * @return {boolean} 是否相等
   * @description 自动处理 string 和 number 类型的 ID 比较
   */
  compareId(id1, id2) {
    if ((!id1 && id1 !== 0) || (!id2 && id2 !== 0)) {
      return false;
    }

    // 规范化后比较
    const normalizedId1 = this.normalizeId(id1);
    const normalizedId2 = this.normalizeId(id2);

    return normalizedId1 === normalizedId2;
  }

  /**
   * 🔥 批量规范化查询参数中的 ID 字段
   * @param {Object} params - 查询参数对象
   * @param {Array<string>} idFields - 需要规范化的 ID 字段名数组
   * @return {Object} 规范化后的参数对象
   * @description 通用的查询参数预处理方法，自动转换所有 ID 类型字段
   */
  normalizeQueryParams(
    params,
    idFields = ['id', 'userId', 'typeId', 'categoryId', 'tagId', 'contentId', 'uAuthor', 'author']
  ) {
    if (!params || typeof params !== 'object') {
      return params;
    }

    const normalized = { ...params };

    idFields.forEach(field => {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        normalized[field] = this.normalizeId(normalized[field]);
      }
    });

    return normalized;
  }

  /**
   * ID映射辅助方法 - 业务层到数据库层
   * @param {Object} data 业务层数据
   * @return {Object} 数据库层数据
   * @protected
   */
  _mapIdToDatabase(data) {
    // MariaDB 模式下不进行 ID 转换，保持数字 ID
    if (this.databaseType === 'mariadb') {
      return data;
    }
    return this.transformer.transformIdFields(data, 'toDatabase');
  }

  /**
   * ID映射辅助方法 - 数据库层到业务层
   * @param {Object} data 数据库层数据
   * @return {Object} 业务层数据
   * @protected
   */
  _mapIdFromDatabase(data) {
    // MariaDB 模式下不进行 ID 转换，保持数字 ID
    if (this.databaseType === 'mariadb') {
      return data;
    }
    return this.transformer.transformIdFields(data, 'fromDatabase');
  }

  /**
   * 标准化查询参数
   * @param {Object} payload 分页和基础参数
   * @param {Object} options 查询选项
   * @return {Object} 标准化后的参数
   * @protected
   */
  _standardizeParams(payload = {}, options = {}) {
    // 合并参数
    const combinedParams = {
      // 从 options 中提取标准参数
      filters: options.filters || options.query || {},
      populate: options.populate || [],
      sort: options.sort || [],
      fields: options.fields || options.files,

      // 从 payload 中提取分页参数
      pagination: {
        current: Number(payload.current || payload.page || 1),
        pageSize: Number(payload.pageSize || payload.limit || 10),
        isPaging: payload.isPaging !== '0',
      },
    };

    // 验证和标准化参数
    const standardParams = this.validator.validate(combinedParams);

    // 转换为目标数据库格式
    // 🔥 关键修复：为MariaDB传递sequelize实例，以支持JSON数组字段的$in查询
    const sequelize = this.databaseType === 'mariadb' && this.connection ? this.connection.getSequelize() : null;
    return this.transformer.transformStandardParams(standardParams, this.databaseType, this.entityName, sequelize);
  }

  /**
   * 处理查询结果
   * @param {*} result 原始查询结果
   * @param {Object} payload 原始分页参数
   * @param options
   * @return {*} 处理后的结果
   * @protected
   */
  _processResult(result, payload = {}, options = {}) {
    // 转换为统一格式
    const transformedResult = this.transformer.transformResult(result, this.databaseType);

    // 如果是分页查询，补充分页信息
    if (transformedResult && transformedResult.docs) {
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

      // 🔥 如果有搜索关键词且有搜索上下文，生成搜索摘要
      if (payload.searchkey && this._searchContext && transformedResult.docs && transformedResult.docs.length > 0) {
        try {
          transformedResult.docs = this._generateSearchSnippets(transformedResult.docs, options);
        } catch (error) {
          console.warn('[BaseStandardRepository] Error generating search snippets:', error.message);
          // 继续返回原始结果，不因为摘要生成失败而中断
        }
      }
    }

    return transformedResult;
  }

  /**
   * 构建搜索条件 - 默认使用增强搜索，子类可以重写
   * @param {string} searchkey 搜索关键词
   * @param {Array} searchKeys 搜索字段
   * @param {Object} options 搜索选项
   * @return {Object} 搜索条件
   * @protected
   */
  _buildSearchCondition(searchkey, searchKeys = [], options = {}) {
    // 默认使用增强搜索功能
    return this._buildEnhancedSearchCondition(searchkey, searchKeys, options);
  }

  /**
   * 合并查询条件
   * @param {Object} baseQuery 基础查询条件
   * @param {Object} searchCondition 搜索条件
   * @param {Object} additionalQuery 额外查询条件
   * @return {Object} 合并后的查询条件
   * @protected
   */
  _mergeQueryConditions(baseQuery = {}, searchCondition = {}, additionalQuery = {}) {
    const conditions = [];

    // 添加基础查询条件
    if (Object.keys(baseQuery).length > 0) {
      conditions.push(baseQuery);
    }

    // 添加搜索条件
    if (Object.keys(searchCondition).length > 0) {
      conditions.push(searchCondition);
    }

    // 添加额外查询条件
    if (Object.keys(additionalQuery).length > 0) {
      conditions.push(additionalQuery);
    }

    // 如果只有一个条件，直接返回
    if (conditions.length === 1) {
      return conditions[0];
    }

    // 多个条件用 $and 连接
    if (conditions.length > 1) {
      return { $and: conditions };
    }

    return {};
  }

  /**
   * 获取默认的关联查询配置
   * 子类可以重写此方法
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [];
  }

  /**
   * 获取默认的搜索字段
   * 子类可以重写此方法
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return [];
  }

  /**
   * 获取默认的排序配置
   * 子类可以重写此方法
   * @return {Object} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return { updatedAt: 'desc' };
  }

  /**
   * 获取默认的属性配置
   * 子类可以重写此方法
   * @return {Object} 默认的属性配置
   * @protected
   */
  _getDefaultAttributes() {
    return {};
  }

  /**
   * 数据预处理（创建前）
   * 子类可以重写此方法
   * @param {Object} data 原始数据
   * @return {Object} 处理后的数据
   * @protected
   */
  _preprocessDataForCreate(data) {
    return data;
  }

  /**
   * 数据预处理（更新前）
   * 子类可以重写此方法
   * @param {Object} data 原始数据
   * @return {Object} 处理后的数据
   * @protected
   */
  _preprocessDataForUpdate(data) {
    return data;
  }

  /**
   * 数据后处理（查询后）
   * 子类可以重写此方法
   * @param {*} data 查询结果
   * @return {*} 处理后的数据
   * @protected
   */
  _postprocessData(data) {
    return data;
  }

  /**
   * 验证数据
   * 子类可以重写此方法
   * @param {Object} data 要验证的数据
   * @param {string} operation 操作类型 ('create' | 'update')
   * @return {Object} 验证结果 { valid: boolean, errors: Array }
   * @protected
   */
  _validateData(data, operation = 'create') {
    return { valid: true, errors: [] };
  }

  /**
   * 记录操作日志
   * @param {string} operation 操作类型
   * @param {*} data 操作数据
   * @param {*} result 操作结果
   * @protected
   */
  _logOperation(operation, data, result) {
    if (this.app.config.repository?.logging) {
      console.log(`[${this.entityName}Repository] ${operation}:`, {
        data: typeof data === 'object' ? JSON.stringify(data) : data,
        result: typeof result === 'object' ? JSON.stringify(result) : result,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 处理错误
   * @param {Error} error 错误对象
   * @param {string} operation 操作类型
   * @param {*} data 操作数据
   * @protected
   */
  _handleError(error, operation, data) {
    const { ErrorFactory } = require('../../exceptions');

    // 记录详细的错误日志
    if (this.app.logger) {
      this.app.logger.error(`[${this.entityName}Repository] ${operation} error:`, {
        error: error.message,
        stack: error.stack,
        operation,
        data: typeof data === 'object' ? JSON.stringify(data) : data,
        entityName: this.entityName,
      });
    } else {
      console.error(`[${this.entityName}Repository] ${operation} error:`, error);
    }

    // 创建上下文信息
    const context = {
      operation,
      resource: this.entityName,
      field: data?.field,
      id: data?.id,
    };

    // 转换为业务异常并抛出
    const businessError = ErrorFactory.fromOriginalError(error, context);
    throw businessError;
  }

  // ===== 🔧 通用钩子方法定义（子类可重写） =====

  /**
   * 获取状态文本映射 - 子类可重写
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return {
      0: '禁用',
      1: '启用',
      2: '禁用',
    };
  }

  // ===== 子类可重写的钩子方法 =====

  /**
   * 子类自定义的创建前数据处理
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    return data;
  }

  /**
   * 子类自定义的更新前数据处理
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    return data;
  }

  /**
   * 子类自定义的数据项处理
   * @param {Object} item 预处理后的数据项
   * @param options
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  // ===== 🔍 增强搜索功能 - 通用部分 =====

  /**
   * 构建增强搜索条件 - 通用逻辑
   * @param {String} searchkey 搜索关键词
   * @param {Array} searchKeys 搜索字段
   * @param {Object} options 搜索选项
   * @return {Object} 搜索条件
   * @protected
   */
  _buildEnhancedSearchCondition(searchkey, searchKeys = [], options = {}) {
    if (!searchkey || !searchKeys.length) {
      return {};
    }

    // 🔥 搜索关键词预处理
    const processedSearchKey = this._preprocessSearchKey(searchkey);

    // 🔥 生成搜索关键词变体
    const searchVariants = this._generateSearchVariants(processedSearchKey);

    // 🔥 构建数据库特定的搜索条件（由子类实现）
    const conditions = this._buildDatabaseSpecificSearchConditions(searchVariants, searchKeys, options);

    // 🔥 添加调试日志
    if (options.debug || process.env.NODE_ENV === 'development') {
      this._logSearchDebugInfo(searchkey, processedSearchKey, searchVariants, searchKeys, conditions);
    }

    // 🔥 保存搜索上下文信息，用于后续的摘要生成
    if (conditions && !this._isEmptySearchCondition(conditions)) {
      this._searchContext = {
        originalKeyword: searchkey,
        processedKeyword: processedSearchKey,
        searchVariants,
        searchKeys,
        timestamp: Date.now(),
      };
    }

    return conditions;
  }

  /**
   * 搜索关键词预处理
   * @param {String} searchkey 原始搜索关键词
   * @return {String} 处理后的搜索关键词
   * @private
   */
  _preprocessSearchKey(searchkey) {
    if (!searchkey || typeof searchkey !== 'string') {
      return '';
    }

    return searchkey
      .trim() // 去除首尾空格
      .toLowerCase() // 转小写
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留字母、数字、空格、中文，其他特殊字符替换为空格
      .replace(/\s+/g, ' ') // 多个空格合并为一个
      .trim();
  }

  /**
   * 生成搜索关键词变体
   * @param {String} processedKey 处理后的搜索关键词
   * @return {Object} 搜索变体对象
   * @private
   */
  _generateSearchVariants(processedKey) {
    const variants = {
      original: processedKey,
      words: [],
      phrases: [],
      combinations: [],
    };

    if (!processedKey) {
      return variants;
    }

    // 分词处理
    const words = processedKey.split(' ').filter(word => word.length > 0);
    variants.words = words;

    // 生成短语（连续2-3个词的组合）
    if (words.length > 1) {
      for (let i = 0; i < words.length - 1; i++) {
        // 2词组合
        variants.phrases.push(words.slice(i, i + 2).join(' '));

        // 3词组合
        if (i < words.length - 2) {
          variants.phrases.push(words.slice(i, i + 3).join(' '));
        }
      }
    }

    // 生成通用变体（基于通用语言模式）
    const commonVariants = this._generateUniversalVariants(processedKey);
    variants.combinations = commonVariants;

    return variants;
  }

  /**
   * 生成通用语言变体（不依赖特定词汇映射）
   * @param {String} key 搜索关键词
   * @return {Array} 变体数组
   * @private
   */
  _generateUniversalVariants(key) {
    const variants = [];
    const lowerKey = key.toLowerCase().trim();

    if (!lowerKey || lowerKey.length < 2) {
      return variants;
    }

    // 1. 常见格式变体生成
    const formatVariants = this._generateFormatVariants(lowerKey);
    variants.push(...formatVariants);

    // 2. 拼写变体生成
    const spellingVariants = this._generateSpellingVariants(lowerKey);
    variants.push(...spellingVariants);

    // 3. 缩写和展开形式
    const abbreviationVariants = this._generateAbbreviationVariants(lowerKey);
    variants.push(...abbreviationVariants);

    // 去重
    return [...new Set(variants)].filter(variant => variant !== lowerKey);
  }

  /**
   * 生成格式变体（连字符、下划线、驼峰等）
   * @param {String} key 关键词
   * @return {Array} 格式变体数组
   * @private
   */
  _generateFormatVariants(key) {
    const variants = [];

    // 如果包含连字符，生成下划线和空格版本
    if (key.includes('-')) {
      variants.push(key.replace(/-/g, '_')); // snake_case
      variants.push(key.replace(/-/g, ' ')); // 空格分隔
      variants.push(key.replace(/-/g, '')); // 连续

      // 驼峰命名
      const camelCase = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      variants.push(camelCase);

      // 帕斯卡命名
      const pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
      variants.push(pascalCase);
    }

    // 如果包含下划线，生成连字符和空格版本
    if (key.includes('_')) {
      variants.push(key.replace(/_/g, '-')); // kebab-case
      variants.push(key.replace(/_/g, ' ')); // 空格分隔
      variants.push(key.replace(/_/g, '')); // 连续

      // 驼峰命名
      const camelCase = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      variants.push(camelCase);
    }

    // 如果包含空格，生成连字符和下划线版本
    if (key.includes(' ')) {
      variants.push(key.replace(/\s+/g, '-')); // kebab-case
      variants.push(key.replace(/\s+/g, '_')); // snake_case
      variants.push(key.replace(/\s+/g, '')); // 连续

      // 驼峰命名
      const words = key.split(/\s+/);
      if (words.length > 1) {
        const camelCase =
          words[0] +
          words
            .slice(1)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
        variants.push(camelCase);

        // 帕斯卡命名
        const pascalCase = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        variants.push(pascalCase);
      }
    }

    // 如果是驼峰命名，生成其他格式
    if (/[a-z][A-Z]/.test(key)) {
      // 转换为 kebab-case
      const kebabCase = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      variants.push(kebabCase);

      // 转换为 snake_case
      const snakeCase = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      variants.push(snakeCase);

      // 转换为空格分隔
      const spaceCase = key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
      variants.push(spaceCase);
    }

    return variants;
  }

  /**
   * 生成拼写变体（常见拼写变化）
   * @param {String} key 关键词
   * @return {Array} 拼写变体数组
   * @private
   */
  _generateSpellingVariants(key) {
    const variants = [];

    // 常见英文拼写变化
    const spellingRules = [
      // 美式英式拼写
      { pattern: /our$/, replacement: 'or' }, // colour -> color
      { pattern: /or$/, replacement: 'our' }, // color -> colour
      { pattern: /ise$/, replacement: 'ize' }, // realise -> realize
      { pattern: /ize$/, replacement: 'ise' }, // realize -> realise
      { pattern: /centre$/, replacement: 'center' }, // centre -> center
      { pattern: /center$/, replacement: 'centre' }, // center -> centre

      // 双写字母变化
      { pattern: /ll/g, replacement: 'l' }, // modelling -> modeling
      { pattern: /([^l])l([^l])/g, replacement: '$1ll$2' }, // modeling -> modelling

      // 常见缩写
      { pattern: /^e([a-z])/i, replacement: 'electronic$1' }, // email -> electronic mail
      { pattern: /^auto/i, replacement: 'automatic' },
      { pattern: /^info/i, replacement: 'information' },
      { pattern: /^config/i, replacement: 'configuration' },
      { pattern: /^admin/i, replacement: 'administrator' },
    ];

    spellingRules.forEach(rule => {
      if (rule.pattern.test(key)) {
        const variant = key.replace(rule.pattern, rule.replacement);
        if (variant !== key && variant.length > 1) {
          variants.push(variant);
        }
      }
    });

    return variants;
  }

  /**
   * 生成缩写和展开变体
   * @param {String} key 关键词
   * @return {Array} 缩写变体数组
   * @private
   */
  _generateAbbreviationVariants(key) {
    const variants = [];

    // 如果包含多个单词，生成首字母缩写
    if (key.includes(' ')) {
      const words = key.split(/\s+/).filter(word => word.length > 0);
      if (words.length >= 2 && words.length <= 5) {
        const acronym = words.map(word => word.charAt(0)).join('');
        if (acronym.length >= 2) {
          variants.push(acronym);
          variants.push(acronym.toUpperCase());
        }
      }
    }

    // 数字和版本处理
    if (/\d/.test(key)) {
      // 移除数字版本
      const withoutNumbers = key.replace(/\d+/g, '');
      if (withoutNumbers.length > 1) {
        variants.push(withoutNumbers);
      }

      // 替换数字为文字
      const numberWords = {
        1: 'one',
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
      };

      let textVersion = key;
      Object.entries(numberWords).forEach(([num, word]) => {
        textVersion = textVersion.replace(new RegExp(num, 'g'), word);
      });

      if (textVersion !== key) {
        variants.push(textVersion);
      }
    }

    return variants;
  }

  /**
   * 构建数据库特定的搜索条件 - 抽象方法，子类必须实现
   * @param {Object} searchVariants 搜索变体
   * @param {Array} searchKeys 搜索字段
   * @param {Object} options 搜索选项
   * @return {Object|Array} 数据库特定的搜索条件
   * @protected
   * @abstract
   */
  _buildDatabaseSpecificSearchConditions(searchVariants, searchKeys, options = {}) {
    throw new Error(`${this.constructor.name} must implement _buildDatabaseSpecificSearchConditions method`);
  }

  /**
   * 检查搜索条件是否为空 - 抽象方法，子类可以重写
   * @param {Object} conditions 搜索条件
   * @return {Boolean} 是否为空
   * @protected
   */
  _isEmptySearchCondition(conditions) {
    return !conditions || (typeof conditions === 'object' && Object.keys(conditions).length === 0);
  }

  /**
   * 记录搜索调试信息
   * @param {String} originalKey 原始关键词
   * @param {String} processedKey 处理后关键词
   * @param {Object} variants 搜索变体
   * @param {Array} searchKeys 搜索字段
   * @param {Object|Array} conditions 生成的条件
   * @private
   */
  _logSearchDebugInfo(originalKey, processedKey, variants, searchKeys, conditions) {
    console.log('\n🔍 ===== 增强搜索调试信息 =====');
    console.log(`📝 原始关键词: "${originalKey}"`);
    console.log(`🔧 处理后关键词: "${processedKey}"`);
    console.log(`🗄️  数据库类型: ${this.databaseType}`);
    console.log(`📚 搜索字段: [${searchKeys.join(', ')}]`);
    console.log(`🎯 分词结果: [${variants.words.join(', ')}]`);
    console.log(`📖 短语组合: [${variants.phrases.join(', ')}]`);
    console.log(`🔄 语言变体: [${variants.combinations.join(', ')}]`);

    // 根据数据库类型显示不同的条件信息
    if (Array.isArray(conditions)) {
      console.log(`⚙️  生成条件数量: ${conditions.length}`);
      console.log('📋 搜索条件样例:');
      conditions.slice(0, 3).forEach((condition, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(condition)}`);
      });
      if (conditions.length > 3) {
        console.log(`   ... 还有 ${conditions.length - 3} 个条件`);
      }
    } else if (conditions && typeof conditions === 'object') {
      console.log('📋 搜索条件结构:');
      console.log(`   ${JSON.stringify(conditions, null, 2)}`);
    }

    console.log('===============================\n');
  }

  /**
   * 为搜索结果生成关键词摘要和高亮
   * @param {Array} docs 文档数组
   * @param {Object} options 选项
   * @return {Array} 包含摘要的文档数组
   * @protected
   */
  _generateSearchSnippets(docs, options = {}) {
    if (!this._searchContext || !docs || docs.length === 0) {
      return docs;
    }

    try {
      const SearchHighlighter = require('../../utils/SearchHighlighter');
      const highlighter = new SearchHighlighter({
        maxSnippetLength: options.maxSnippetLength || 200,
        contextLength: options.contextLength || 60,
        maxSnippets: options.maxSnippets || 2,
        highlightClass: 'bg-yellow-200 dark:bg-yellow-700 px-1 rounded',
        highlightTag: 'mark',
      });

      // 准备搜索关键词
      const { originalKeyword, processedKeyword, searchVariants } = this._searchContext;
      const allKeywords = [
        originalKeyword,
        processedKeyword,
        ...searchVariants.words,
        ...searchVariants.phrases,
        ...searchVariants.combinations,
      ]
        .filter(Boolean)
        .filter((keyword, index, arr) => arr.indexOf(keyword) === index);

      return docs.map(doc => {
        try {
          const enhanced = { ...doc };

          // 为每个搜索字段生成摘要
          if (this._searchContext.searchKeys) {
            this._searchContext.searchKeys.forEach(field => {
              try {
                if (doc[field] && typeof doc[field] === 'string') {
                  const result = highlighter.extractAndHighlight(doc[field], allKeywords, {
                    maxSnippets: field === 'comments' ? 3 : 1, // comments 字段可以有更多摘要
                    contextLength: field === 'title' ? 30 : 60, // 标题字段上下文短一些
                  });

                  if (result.hasMatches) {
                    // 保存原始值
                    enhanced[`${field}_original`] = doc[field];

                    // 如果是标题或短文本，使用高亮版本
                    if (field === 'title' || field === 'stitle' || doc[field].length < 100) {
                      enhanced[field] = result.highlighted;
                    } else {
                      // 长文本使用摘要
                      enhanced[field] = result.snippets.map(snippet => snippet.highlighted).join(' ... ');
                    }

                    // 添加摘要信息
                    enhanced[`${field}_snippets`] = result.snippets;
                    enhanced[`${field}_matchCount`] = result.matchCount;
                    enhanced[`${field}_hasMatches`] = true;
                  }
                }
              } catch (fieldError) {
                console.warn(`[SearchSnippets] Error processing field ${field}:`, fieldError.message);
              }
            });
          }

          // 智能选择最佳摘要作为主摘要
          try {
            enhanced.searchSummary = this._generateBestSummary(enhanced, allKeywords, highlighter);
          } catch (summaryError) {
            console.warn('[SearchSnippets] Error generating best summary:', summaryError.message);
            enhanced.searchSummary = {
              text: doc.discription || doc.description || doc.comments || doc.title || '',
              highlighted: doc.discription || doc.description || doc.comments || doc.title || '',
              source: 'fallback',
              matchCount: 0,
              hasMatches: false,
            };
          }

          return enhanced;
        } catch (docError) {
          console.warn('[SearchSnippets] Error processing document:', docError.message);
          return doc; // 返回原始文档
        }
      });
    } catch (error) {
      console.warn('[SearchSnippets] Error in snippet generation:', error.message);
      return docs; // 返回原始文档数组
    }
  }

  /**
   * 生成最佳搜索摘要
   * @param {Object} doc 文档对象
   * @param {Array} keywords 关键词数组
   * @param {SearchHighlighter} highlighter 高亮器实例
   * @return {Object} 摘要对象
   * @private
   */
  _generateBestSummary(doc, keywords, highlighter) {
    const summary = {
      text: '',
      highlighted: '',
      source: '',
      matchCount: 0,
      hasMatches: false,
    };

    // 按优先级检查字段（兼容不同的字段名）
    const fieldPriority = [
      { field: 'title', weight: 3, maxLength: 100 },
      { field: 'stitle', weight: 2, maxLength: 120 },
      { field: 'discription', weight: 2, maxLength: 200 }, // MariaDB版本
      { field: 'description', weight: 2, maxLength: 200 }, // 标准版本
      { field: 'comments', weight: 1, maxLength: 300 },
    ];

    let bestMatch = null;
    let bestScore = 0;

    fieldPriority.forEach(({ field, weight, maxLength }) => {
      if (doc[`${field}_hasMatches`] && doc[`${field}_snippets`]) {
        const snippets = doc[`${field}_snippets`];
        const matchCount = doc[`${field}_matchCount`] || 0;

        // 计算评分：匹配数量 * 字段权重
        const score = matchCount * weight;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            field,
            snippets,
            matchCount,
            weight,
          };
        }
      }
    });

    if (bestMatch) {
      const snippetTexts = bestMatch.snippets.map(s => s.highlighted).join(' ... ');
      summary.text = bestMatch.snippets.map(s => s.text).join(' ... ');
      summary.highlighted = snippetTexts;
      summary.source = bestMatch.field;
      summary.matchCount = bestMatch.matchCount;
      summary.hasMatches = true;
    } else {
      // 如果没有匹配，使用描述或评论的开头（兼容不同字段名）
      const fallbackText = doc.discription || doc.description || doc.comments || doc.title || '';
      if (fallbackText.length > 150) {
        summary.text = fallbackText.substring(0, 147) + '...';
        summary.highlighted = summary.text;
      } else {
        summary.text = fallbackText;
        summary.highlighted = fallbackText;
      }
      summary.source = 'fallback';
    }

    return summary;
  }
}

module.exports = BaseStandardRepository;
