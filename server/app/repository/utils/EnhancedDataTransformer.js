/**
 * 增强版数据转换器
 * 支持统一参数接口的转换，兼容 MongoDB 和 MariaDB
 */
'use strict';

const { StandardParamsValidator } = require('../interfaces/IStandardParams');
const moment = require('moment');
const _ = require('lodash');

class EnhancedDataTransformer {
  constructor(app) {
    this.app = app;
    this.validator = new StandardParamsValidator();
    this.modelRegistry = new Map();
    this.relationMappings = new Map();

    // 🔥 Phase3: 查询增强配置（默认关闭，不影响现有功能）
    this.config = {
      // 是否启用嵌套深度检查（默认关闭，保持向后兼容）
      enableDepthCheck: false,
      maxNestingDepth: 5, // 最大嵌套深度

      // 是否启用查询复杂度检查（默认关闭，保持向后兼容）
      enableComplexityCheck: false,
      maxQueryComplexity: 100, // 最大查询复杂度

      // 是否启用日期自动标准化（默认关闭，保持向后兼容）
      enableDateNormalization: false,
      dateTimezone: 'UTC', // 日期时区
    };
  }

  /**
   * 🔥 Phase3: 配置查询增强选项
   * @param {Object} options 配置选项
   */
  configureQueryEnhancements(options = {}) {
    this.config = {
      ...this.config,
      ...options,
    };
  }

  /**
   * 转换主键：统一数据格式
   * @param {Object|Array} data 要转换的数据
   * @return {Object|Array} 转换后的数据
   */
  transformToUnifiedFormat(data) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this._transformSingleItem(item));
    }

    return this._transformSingleItem(data);
  }

  /**
   * 转换单个数据项
   * @param {Object} item 数据项
   * @return {Object} 转换后的数据项
   * @private
   */
  _transformSingleItem(item) {
    if (!item || typeof item !== 'object') return item;
    return { ...item };
  }

  /**
   * 格式化时间字段
   * @param {Object|Array} data 包含时间字段的数据
   * @param {Array} timeFields 时间字段名数组
   * @return {Object|Array} 格式化后的数据
   */
  formatTimeFields(data, timeFields = ['createdAt', 'updatedAt']) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this._formatItemTimeFields(item, timeFields));
    }

    return this._formatItemTimeFields(data, timeFields);
  }

  /**
   * 格式化单个项的时间字段
   * @param {Object} item 数据项
   * @param {Array} timeFields 时间字段名数组
   * @return {Object} 格式化后的数据项
   * @private
   */
  _formatItemTimeFields(item, timeFields) {
    if (!item || typeof item !== 'object') return item;

    const formatted = { ...item };

    timeFields.forEach(field => {
      if (formatted[field]) {
        formatted[field] = moment(formatted[field]).format('YYYY-MM-DD HH:mm:ss');
      }
    });

    return formatted;
  }

  /**
   * 转换前端查询条件：id -> id (用于MariaDB查询)
   * @param {Object} query 前端传入的查询条件
   * @return {Object} 适合MariaDB的查询条件
   */
  transformQueryForMariaDB(query) {
    if (!query || typeof query !== 'object') return query;

    const transformed = { ...query };

    // 转换 id 字段到 id
    if (transformed.id) {
      transformed.id = Number(transformed.id);
    }

    return transformed;
  }

  /**
   * 注册模型映射关系
   * @param {string} entityName 实体名称
   * @param {Object} modelConfig 模型配置
   */
  registerModel(entityName, modelConfig) {
    this.modelRegistry.set(entityName, {
      mongoModel: modelConfig.mongoModel,
      mariaModel: modelConfig.mariaModel,
      relations: modelConfig.relations || {},
    });
  }

  /**
   * 注册关联关系映射
   * @param {string} entityName 实体名称
   * @param {string} relationPath 关联路径
   * @param {Object} relationConfig 关联配置
   */
  registerRelation(entityName, relationPath, relationConfig) {
    const key = `${entityName}.${relationPath}`;
    this.relationMappings.set(key, relationConfig);
  }

  /**
   * 转换 MongoDB 操作符为 MariaDB SQL 表达式
   * @param {Object} data 包含 MongoDB 操作符的数据
   * @param {Object} sequelize Sequelize 实例
   * @return {Object} 转换后的 MariaDB 更新数据
   */
  transformMongoOperatorsForMariaDB(data, sequelize) {
    const transformed = {};

    for (const [key, value] of Object.entries(data)) {
      if (key === '$inc') {
        // $inc: { clickNum: 1 } → clickNum: literal('clickNum + 1')
        for (const [field, increment] of Object.entries(value)) {
          if (typeof increment === 'number') {
            transformed[field] = sequelize.literal(`${field} + ${increment}`);
          }
        }
      } else if (key === '$set') {
        // $set 操作直接展开
        Object.assign(transformed, value);
      } else if (key === '$unset') {
        // $unset 操作设置为 null
        for (const field of Object.keys(value)) {
          transformed[field] = null;
        }
      } else if (key === '$push') {
        // $push 操作 - 对于 JSON 字段
        for (const [field, pushValue] of Object.entries(value)) {
          // 🔥 修复：为字段添加表别名前缀，避免关联查询时的列名歧义
          const tableAlias = this._getTableAlias(entityName, hasJoins, sequelize);
          const columnRef = tableAlias ? `${tableAlias}.${field}` : field;
          transformed[field] = sequelize.fn('JSON_ARRAY_APPEND', sequelize.col(columnRef), '$', pushValue);
        }
      } else if (key === '$pull') {
        // $pull 操作 - 对于 JSON 字段
        for (const [field, pullValue] of Object.entries(value)) {
          // 🔥 修复：为字段添加表别名前缀，避免关联查询时的列名歧义
          const tableAlias = this._getTableAlias(entityName, hasJoins, sequelize);
          const columnRef = tableAlias ? `${tableAlias}.${field}` : field;
          transformed[field] = sequelize.fn(
            'JSON_REMOVE',
            sequelize.col(columnRef),
            sequelize.literal(`JSON_UNQUOTE(JSON_SEARCH(${columnRef}, 'one', '${pullValue}'))`)
          );
        }
      } else if (key === '$addToSet') {
        // $addToSet 操作 - 避免重复添加
        for (const [field, addValue] of Object.entries(value)) {
          transformed[field] = sequelize.literal(
            `CASE WHEN JSON_SEARCH(${field}, 'one', '${addValue}') IS NULL 
             THEN JSON_ARRAY_APPEND(${field}, '$', '${addValue}') 
             ELSE ${field} END`
          );
        }
      } else if (!key.startsWith('$')) {
        // 普通字段直接赋值
        transformed[key] = value;
      }
    }

    return transformed;
  }

  /**
   * 获取表别名
   * @param {string} entityName 实体名称
   * @param {boolean} hasJoins 是否存在关联查询
   * @param {Object} sequelize Sequelize 实例 (可选，用于动态获取表名)
   * @return {string|null} 表别名
   * @private
   */
  _getTableAlias(entityName, hasJoins = false, sequelize = null) {
    if (!entityName) return null;

    // 只有在存在关联查询时才使用表别名
    if (!hasJoins) {
      return null;
    }

    // 🔥 通用化改进：动态获取表名而不是硬编码
    if (sequelize && sequelize.models) {
      // 尝试从 Sequelize 模型中获取表名
      const modelName = this._getModelName(entityName);
      const model = sequelize.models[modelName];
      if (model && model.tableName) {
        return model.tableName;
      }
    }

    // 兜底方案：使用命名约定
    return this._getTableNameByConvention(entityName);
  }

  /**
   * 根据命名约定获取表名
   * @param {string} entityName 实体名称
   * @return {string} 表名
   * @private
   */
  _getTableNameByConvention(entityName) {
    // 🔥 统一后简化：所有模型名都是驼峰，直接转换为表名
    const modelName = this._getModelName(entityName);

    // 转换为下划线格式并加复数后缀
    const snakeCaseName = this._camelToSnake(modelName);
    return this._pluralize(snakeCaseName);
  }

  /**
   * 驼峰命名转下划线命名
   * @param {string} str 驼峰命名字符串
   * @return {string} 下划线命名字符串
   * @private
   */
  _camelToSnake(str) {
    // 特殊情况处理
    const specialCases = {
      AIModel: 'ai_model',
      AIUsageLog: 'ai_usage_log',
      APIKey: 'api_key',
      HTTPRequest: 'http_request',
      XMLParser: 'xml_parser',
    };

    if (specialCases[str]) {
      return specialCases[str];
    }

    // 一般规则：在大写字母前加下划线，然后转小写
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  /**
   * 单数转复数（简单规则）
   * @param {string} word 单数词
   * @return {string} 复数词
   * @private
   */
  _pluralize(word) {
    // 特殊复数形式
    const irregulars = {
      category: 'categories',
      entity: 'entities',
      activity: 'activities',
      company: 'companies',
    };

    if (irregulars[word]) {
      return irregulars[word];
    }

    // 一般规则：以 y 结尾且前面是辅音，变 ies
    if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
      return word.slice(0, -1) + 'ies';
    }

    // 以 s, x, z, ch, sh 结尾，加 es
    if (/[sxz]$/.test(word) || /[cs]h$/.test(word)) {
      return word + 'es';
    }

    // 默认加 s
    return word + 's';
  }

  /**
   * 获取JSON数组字段列表 - 基于Schema定义
   * @param {string} entityName 实体名称
   * @param {Object} sequelize Sequelize实例
   * @return {Array} JSON数组字段列表
   * @private
   */
  _getJsonArrayFields(entityName = null, sequelize = null) {
    // 优先从Schema定义中动态获取
    if (sequelize && entityName) {
      try {
        const jsonFields = this._extractJsonFieldsFromSchema(entityName, sequelize);
        if (jsonFields.length > 0) {
          return jsonFields;
        }
      } catch (error) {
        console.warn(`Failed to extract JSON fields for ${entityName}:`, error.message);
      }
    }

    // 兜底方案：返回已知的常用JSON数组字段
    return this._getFallbackJsonArrayFields();
  }

  /**
   * 从Schema定义中提取JSON数组字段
   * @param {string} entityName 实体名称
   * @param {Object} sequelize Sequelize实例
   * @return {Array} JSON数组字段列表
   * @private
   */
  _extractJsonFieldsFromSchema(entityName, sequelize) {
    const jsonFields = [];

    try {
      // 获取模型定义
      const modelName = this._getModelName(entityName);
      const model = sequelize.models[modelName];

      if (model && model.rawAttributes) {
        // 遍历模型属性，查找JSON类型字段
        for (const [fieldName, attribute] of Object.entries(model.rawAttributes)) {
          // 检查字段类型和getter/setter，判断是否为JSON数组字段
          if (this._isJsonArrayField(fieldName, attribute)) {
            jsonFields.push(fieldName);
          }
        }
      }
    } catch (error) {
      console.warn(`Error extracting JSON fields from schema for ${entityName}:`, error.message);
    }

    return jsonFields;
  }

  /**
   * 判断字段是否为JSON数组字段 - 基于Schema定义
   * @param {string} fieldName 字段名
   * @param {Object} attribute 字段属性
   * @return {boolean} 是否为JSON数组字段
   * @private
   */
  _isJsonArrayField(fieldName, attribute) {
    // 🔥 修复：检查字段类型为 JSON 或 TEXT 且有JSON处理的getter/setter
    const isJsonType =
      attribute.type && (attribute.type.constructor.name === 'JSON' || attribute.type.constructor.name === 'TEXT');

    if (isJsonType) {
      // 检查是否有JSON处理的getter
      if (attribute.get && attribute.get.toString().includes('JSON.parse')) {
        return true;
      }
      // 检查是否有JSON处理的setter
      if (attribute.set && attribute.set.toString().includes('JSON.stringify')) {
        return true;
      }
    }

    return false;
  }

  /**
   * 🔥 获取字段的类型信息（用于类型转换）
   * @param {string} fieldName 字段名
   * @param {string} entityName 实体名称
   * @param {Object} sequelize Sequelize 实例
   * @return {string|null} 字段类型名称 (INTEGER, STRING, BOOLEAN, etc.)
   * @private
   */
  _getFieldType(fieldName, entityName, sequelize) {
    if (!sequelize || !entityName || !fieldName) {
      return null;
    }

    try {
      const modelName = this._getModelName(entityName);
      const model = sequelize.models[modelName];

      if (model && model.rawAttributes && model.rawAttributes[fieldName]) {
        const attribute = model.rawAttributes[fieldName];
        if (attribute.type) {
          // 🔥 修复：Sequelize 的 type 可能是实例也可能是构造函数
          // 优先使用 type.constructor.key，这是 Sequelize 内部的类型标识
          if (attribute.type.constructor && attribute.type.constructor.key) {
            return attribute.type.constructor.key.toUpperCase();
          }
          // 兜底：使用 constructor.name
          if (attribute.type.constructor && attribute.type.constructor.name) {
            const typeName = attribute.type.constructor.name;
            // 排除泛型的 'Function' 名称
            if (typeName !== 'Function') {
              return typeName.toUpperCase();
            }
          }
          // 最后尝试：检查 type.key（直接实例的情况）
          if (attribute.type.key) {
            return attribute.type.key.toUpperCase();
          }
        }
      }
    } catch (error) {
      // 忽略错误，返回 null
    }

    return null;
  }

  /**
   * 🔥 根据字段类型智能转换值
   * @param {*} value 原始值
   * @param {string} fieldName 字段名
   * @param {string} entityName 实体名称
   * @param {Object} sequelize Sequelize 实例
   * @return {*} 转换后的值
   * @private
   */
  _convertValueByFieldType(value, fieldName, entityName, sequelize) {
    // 如果值为 null 或 undefined，直接返回
    if (value === null || value === undefined) {
      return value;
    }

    // 获取字段类型
    const fieldType = this._getFieldType(fieldName, entityName, sequelize);

    // 根据字段类型进行转换
    switch (fieldType) {
      case 'INTEGER':
      case 'BIGINT':
      case 'TINYINT':
      case 'SMALLINT':
      case 'MEDIUMINT':
        // 数字类型：字符串转数字
        if (typeof value === 'string' && value.trim() !== '') {
          const num = Number(value);
          return isNaN(num) ? value : num;
        }
        return typeof value === 'number' ? value : Number(value);

      case 'FLOAT':
      case 'DOUBLE':
      case 'DECIMAL':
        // 浮点数类型：字符串转数字
        if (typeof value === 'string' && value.trim() !== '') {
          const num = parseFloat(value);
          return isNaN(num) ? value : num;
        }
        return typeof value === 'number' ? value : parseFloat(value);

      case 'BOOLEAN':
      case 'BOOL':
        // 布尔类型：转换为布尔值
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);

      case 'DATE':
      case 'DATEONLY':
      case 'TIME':
        // 日期类型：确保是 Date 对象或有效的日期字符串
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date;
        }
        return value;

      default:
        // 其他类型（STRING, TEXT, JSON等）保持原样
        return value;
    }
  }

  /**
   * 获取兜底的JSON数组字段列表
   * @return {Array} 兜底字段列表
   * @private
   */
  _getFallbackJsonArrayFields() {
    // 兜底方案：返回当前系统中已知的JSON数组字段
    return [
      'praiseMessages',
      'despiseMessage',
      'favorites',
      'praiseContents',
      'despises',
      'followers',
      'watchers',
      'watchTags',
      'tags',
      'categories',
      'supportedTasks',
    ];
  }

  /**
   * 获取模型名称
   * @param {string} entityName 实体名称
   * @return {string} 模型名称
   * @private
   */
  _getModelName(entityName) {
    // 🔥 统一命名：所有模型都使用驼峰命名，与 MongoDB 保持一致
    const nameMapping = {
      // 核心模型
      User: 'User',
      Admin: 'Admin',
      Message: 'Message',
      Content: 'Content',
      ContentCategory: 'ContentCategory',
      ContentTag: 'ContentTag',
      Template: 'Template',
      Plugin: 'Plugin',
      Menu: 'Menu',
      ApiKey: 'ApiKey',
      SystemOptionLog: 'SystemOptionLog',
      AdsItems: 'AdsItems',
      MailTemplate: 'MailTemplate',
      Role: 'Role',
      Ads: 'Ads',
      UploadFile: 'UploadFile',
      SystemConfig: 'SystemConfig',

      // AI 插件模型
      AIModel: 'AIModel',
      PromptTemplate: 'PromptTemplate',
      AIUsageLog: 'AIUsageLog',
    };

    return nameMapping[entityName] || entityName;
  }

  /**
   * 构建 MariaDB WHERE 条件
   * @param {Object} filters 过滤条件
   * @param {Object} Op Sequelize 操作符
   * @param {Object} sequelize Sequelize 实例 (可选)
   * @param {string} entityName 实体名称 (可选，用于获取字段配置)
   * @param {boolean} hasJoins 是否存在关联查询
   * @param {number} depth 当前嵌套深度（Phase3新增，可选参数）
   * @param {number} maxDepth 最大嵌套深度（Phase3新增，可选参数）
   * @return {Object} MariaDB WHERE 条件
   */
  buildMariaDBWhereCondition(
    filters,
    Op,
    sequelize = null,
    entityName = null,
    hasJoins = false,
    depth = 0,
    maxDepth = null
  ) {
    const whereCondition = {};

    // 参数验证
    if (!filters || typeof filters !== 'object') {
      return whereCondition;
    }

    // 🔥 Phase3: 嵌套深度检查（仅在配置启用时生效）
    const effectiveMaxDepth = maxDepth !== null ? maxDepth : this.config.maxNestingDepth;
    if (this.config.enableDepthCheck && depth > effectiveMaxDepth) {
      throw new Error(
        `[EnhancedDataTransformer] Query nesting too deep (current: ${depth}, max: ${effectiveMaxDepth}). ` +
          'Please simplify your query to avoid performance issues.'
      );
    }

    // 🔥 通用方案：获取JSON数组字段配置
    const jsonArrayFields = this._getJsonArrayFields(entityName, sequelize);

    for (const [key, value] of Object.entries(filters)) {
      // 🔥 关键修复：处理顶级逻辑操作符 ($or, $and 等)
      if (key.startsWith('$')) {
        const mariaOperator = this._getMariaOperator(key);
        if (Array.isArray(value)) {
          // 🔥 Phase3: 递归处理每个条件，传递深度参数
          whereCondition[mariaOperator] = value.map(condition =>
            this.buildMariaDBWhereCondition(condition, Op, sequelize, entityName, hasJoins, depth + 1, maxDepth)
          );
        }
        continue;
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // 处理 MongoDB 风格的操作符
        if (value.$eq !== undefined) {
          // 🔥 关键修复：特殊处理null值，在MariaDB中应该使用IS NULL
          if (value.$eq === null) {
            whereCondition[key] = { [Op.is]: null };
          } else {
            // 🔥 类型转换：根据字段类型智能转换值
            const convertedValue = this._convertValueByFieldType(value.$eq, key, entityName, sequelize);
            whereCondition[key] = convertedValue;
          }
        } else if (value.$ne !== undefined) {
          // 🔥 类型转换：根据字段类型智能转换值
          const convertedValue = this._convertValueByFieldType(value.$ne, key, entityName, sequelize);
          whereCondition[key] = { [Op.ne]: convertedValue };
        } else if (value.$in !== undefined) {
          // 🔥 关键修复：处理JSON数组字段的$in查询
          if (jsonArrayFields.includes(key) && sequelize) {
            // 🔥 关键修复：处理空数组的情况
            if (!Array.isArray(value.$in) || value.$in.length === 0) {
              // 空数组应该返回没有匹配的条件，使用永远为false的条件
              whereCondition[key] = { [Op.eq]: null, [Op.ne]: null }; // 永远为false的条件
            } else {
              // 🔥 关键修复：对于JSON数组字段，使用JSON_CONTAINS函数
              // 根据数据类型正确处理：数字直接传递，字符串需要加引号
              const conditions = value.$in.map(item => {
                const searchValue = typeof item === 'string' ? `"${item}"` : item.toString();
                // 🔥 修复：为字段添加表别名前缀，避免关联查询时的列名歧义
                const tableAlias = this._getTableAlias(entityName, hasJoins, sequelize);
                const columnRef = tableAlias ? `${tableAlias}.${key}` : key;
                return sequelize.where(
                  sequelize.fn('JSON_CONTAINS', sequelize.col(columnRef), searchValue),
                  Op.eq,
                  true
                );
              });
              // 🔥 关键修复：为单个字段的$in查询设置OR条件
              if (conditions.length === 1) {
                whereCondition[key] = conditions[0];
              } else {
                whereCondition[key] = { [Op.or]: conditions };
              }
            }
          } else {
            // 🔥 类型转换：对数组中的每个值进行类型转换
            const convertedArray = Array.isArray(value.$in)
              ? value.$in.map(item => this._convertValueByFieldType(item, key, entityName, sequelize))
              : value.$in;
            whereCondition[key] = { [Op.in]: convertedArray };
          }
        } else if (value.$nin !== undefined) {
          // 🔥 关键修复：处理JSON数组字段的$nin查询
          if (jsonArrayFields.includes(key) && sequelize) {
            // 🔥 关键修复：对于JSON数组字段，使用NOT JSON_CONTAINS函数
            // 根据数据类型正确处理：数字直接传递，字符串需要加引号
            const conditions = value.$nin.map(item => {
              const searchValue = typeof item === 'string' ? `"${item}"` : item.toString();
              // 🔥 修复：为字段添加表别名前缀，避免关联查询时的列名歧义
              const tableAlias = this._getTableAlias(entityName, hasJoins, sequelize);
              const columnRef = tableAlias ? `${tableAlias}.${key}` : key;
              return sequelize.where(
                sequelize.fn('JSON_CONTAINS', sequelize.col(columnRef), searchValue),
                Op.eq,
                false
              );
            });
            // 🔥 关键修复：为单个字段的$nin查询设置AND条件
            if (conditions.length === 1) {
              whereCondition[key] = conditions[0];
            } else {
              whereCondition[key] = { [Op.and]: conditions };
            }
          } else {
            // 🔥 类型转换：对数组中的每个值进行类型转换
            const convertedArray = Array.isArray(value.$nin)
              ? value.$nin.map(item => this._convertValueByFieldType(item, key, entityName, sequelize))
              : value.$nin;
            whereCondition[key] = { [Op.notIn]: convertedArray };
          }
        } else if (value.$gt !== undefined) {
          // 🔥 类型转换：根据字段类型智能转换值
          const convertedValue = this._convertValueByFieldType(value.$gt, key, entityName, sequelize);
          whereCondition[key] = { [Op.gt]: convertedValue };
        } else if (value.$gte !== undefined) {
          // 🔥 类型转换：根据字段类型智能转换值
          const convertedValue = this._convertValueByFieldType(value.$gte, key, entityName, sequelize);
          whereCondition[key] = { [Op.gte]: convertedValue };
        } else if (value.$lt !== undefined) {
          // 🔥 类型转换：根据字段类型智能转换值
          const convertedValue = this._convertValueByFieldType(value.$lt, key, entityName, sequelize);
          whereCondition[key] = { [Op.lt]: convertedValue };
        } else if (value.$lte !== undefined) {
          // 🔥 类型转换：根据字段类型智能转换值
          const convertedValue = this._convertValueByFieldType(value.$lte, key, entityName, sequelize);
          whereCondition[key] = { [Op.lte]: convertedValue };
        } else if (value.$regex !== undefined) {
          // 转换正则表达式为 LIKE 操作
          let pattern = value.$regex;
          if (pattern instanceof RegExp) {
            pattern = pattern.source;
          }
          // 移除正则表达式的标记
          pattern = pattern.toString().replace(/^\/|\/[gimuy]*$/g, '');

          if (value.$options && value.$options.includes('i')) {
            // MySQL/MariaDB 不支持 iLike，使用 like 结合 UPPER 函数实现不区分大小写
            // 但为了简化，在这里我们假设数据库的 collation 已经设置为不区分大小写
            whereCondition[key] = { [Op.like]: `%${pattern}%` };
          } else {
            whereCondition[key] = { [Op.like]: `%${pattern}%` };
          }
        } else if (value.$exists !== undefined) {
          // 🔥 关键修复：$exists 转换为 IS NULL / IS NOT NULL
          if (value.$exists) {
            whereCondition[key] = { [Op.not]: null };
          } else {
            whereCondition[key] = { [Op.is]: null };
          }
        } else if (value.$size !== undefined) {
          // JSON 数组大小检查
          // 🔥 修复：为字段添加表别名前缀，避免关联查询时的列名歧义
          const tableAlias = this._getTableAlias(entityName, hasJoins, sequelize);
          const columnRef = tableAlias ? `${tableAlias}.${key}` : key;
          whereCondition[key] = sequelize.where(sequelize.fn('JSON_LENGTH', sequelize.col(columnRef)), value.$size);
        } else if (value.$contains !== undefined) {
          // 🔥 新增：处理 $contains 操作符，用于 JSON 数组字段查询
          if (jsonArrayFields.includes(key) && sequelize) {
            // 对于 JSON 数组字段，使用 JSON_CONTAINS 函数
            const searchValue =
              typeof value.$contains === 'string' ? `"${value.$contains}"` : value.$contains.toString();

            // 🔥 修复：为字段添加表别名前缀，避免关联查询时的列名歧义
            // 对于主表查询，使用表名作为别名；对于关联查询，使用实体名
            const tableAlias = this._getTableAlias(entityName, hasJoins, sequelize);
            const columnRef = tableAlias ? `${tableAlias}.${key}` : key;
            whereCondition[key] = sequelize.where(
              sequelize.fn('JSON_CONTAINS', sequelize.col(columnRef), searchValue),
              Op.eq,
              true
            );
          } else {
            // 对于普通字段，使用 LIKE 操作
            whereCondition[key] = { [Op.like]: `%${value.$contains}%` };
          }
        } else {
          // 直接值比较 - 也需要类型转换
          const convertedValue = this._convertValueByFieldType(value, key, entityName, sequelize);
          whereCondition[key] = convertedValue;
        }
      } else if (Array.isArray(value)) {
        // 🔥 类型转换：数组值默认使用 IN 操作，对每个值进行类型转换
        const convertedArray = value.map(item => this._convertValueByFieldType(item, key, entityName, sequelize));
        whereCondition[key] = { [Op.in]: convertedArray };
      } else {
        // 🔥 类型转换：简单值也需要类型转换
        const convertedValue = this._convertValueByFieldType(value, key, entityName, sequelize);
        whereCondition[key] = convertedValue;
      }
    }

    return whereCondition;
  }

  /**
   * 构建 MariaDB INCLUDE 选项
   * @param {Array} populate 关联查询配置
   * @param {string} entityName 实体名称
   * @return {Array} MariaDB include 选项
   */
  buildMariaDBIncludeOptions(populate, entityName = '') {
    if (!populate || !Array.isArray(populate)) {
      return [];
    }

    return populate.map(config => {
      const include = {
        association: config.path,
        required: false, // LEFT JOIN
      };

      // 字段选择
      if (config.select && config.select.length > 0) {
        include.attributes = [...config.select];
        // 确保包含主键
        if (!include.attributes.includes('id')) {
          include.attributes.push('id');
        }
      }

      // 过滤条件
      if (config.filters && Object.keys(config.filters).length > 0) {
        include.where = this.buildMariaDBWhereCondition(config.filters, this.Op, null, entityName);
      }

      // 排序
      if (config.sort && config.sort.length > 0) {
        include.order = config.sort.map(({ field, order }) => [field, order.toUpperCase()]);
      }

      // 限制数量
      if (config.limit && config.limit > 0) {
        include.limit = config.limit;
      }

      // 嵌套关联查询
      if (config.populate && config.populate.length > 0) {
        include.include = this.buildMariaDBIncludeOptions(config.populate, entityName);
      }

      // 处理中间表关联
      const relationKey = `${entityName}.${config.path}`;
      const relationConfig = this.relationMappings.get(relationKey);
      if (relationConfig && relationConfig.through) {
        include.through = {
          attributes: [], // 不返回中间表字段
        };
      }

      return include;
    });
  }

  /**
   * 分离 MariaDB 关联数据
   * @param {Object} data 原始数据
   * @param {Array} relationFields 关联字段列表
   * @return {Object} { mainData, relatedData }
   */
  separateRelatedDataForMariaDB(data, relationFields = ['categories', 'tags']) {
    const mainData = { ...data };
    const relatedData = {};

    relationFields.forEach(field => {
      if (mainData[field] !== undefined) {
        relatedData[field] = mainData[field];
        delete mainData[field];
      }
    });

    return { mainData, relatedData };
  }

  /**
   * 处理 MariaDB JSON 字段
   * @param {Object} data 数据对象
   * @param {Array} jsonFields JSON 字段列表
   * @return {Object} 处理后的数据
   */
  processMariaDBJSONFields(data, jsonFields = ['tags', 'categories', 'keywords']) {
    const processedData = { ...data };

    jsonFields.forEach(field => {
      if (processedData[field] !== undefined) {
        if (typeof processedData[field] === 'string') {
          try {
            processedData[field] = JSON.parse(processedData[field]);
          } catch (e) {
            processedData[field] = [];
          }
        } else if (!Array.isArray(processedData[field])) {
          processedData[field] = [];
        }
      }
    });

    return processedData;
  }

  /**
   * 构建 MariaDB 排序选项
   * @param {Array} sort 排序配置
   * @return {Array} MariaDB order 选项
   */
  buildMariaDBOrderOptions(sort) {
    if (!sort || !Array.isArray(sort)) {
      return [];
    }

    return sort.map(({ field, order }) => {
      // 处理特殊排序字段
      if (field === 'id') {
        return ['id', order.toUpperCase()];
      }

      // 处理 JSON 字段排序
      if (field.includes('.')) {
        const [jsonField, jsonPath] = field.split('.');
        return [sequelize.literal(`JSON_EXTRACT(${jsonField}, '$.${jsonPath}')`), order.toUpperCase()];
      }

      return [field, order.toUpperCase()];
    });
  }

  /**
   * 处理 MariaDB 关联表更新
   * @param {string} contentId 内容ID
   * @param {Array} relationIds 关联ID数组
   * @param {Object} relationModel 关联表模型
   * @param {string} foreignKeyField 外键字段名
   * @return {Promise} 更新结果
   */
  async updateMariaDBRelations(contentId, relationIds, relationModel, foreignKeyField = 'categoryId') {
    // 删除旧关联
    await relationModel.destroy({
      where: { contentId },
    });

    // 创建新关联
    if (relationIds && relationIds.length > 0) {
      const relations = relationIds.map(relationId => ({
        contentId,
        [foreignKeyField]: relationId,
      }));
      await relationModel.bulkCreate(relations);
    }

    return { success: true, count: relationIds ? relationIds.length : 0 };
  }

  /**
   * 全局ID字段映射 - 业务层 id <-> 数据库层 _id
   * @param {Object} data 需要转换的数据
   * @param {string} direction 转换方向: 'toDatabase' | 'fromDatabase'
   * @return {Object} 转换后的数据
   */
  transformIdFields(data, direction = 'toDatabase') {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const transform = obj => {
      if (Array.isArray(obj)) {
        return obj.map(item => transform(item));
      }

      if (obj && typeof obj === 'object') {
        const transformed = {};

        for (const [key, value] of Object.entries(obj)) {
          let newKey = key;
          let newValue = value;

          // ID字段映射
          if (direction === 'toDatabase') {
            // 业务层 id -> 数据库层 _id
            if (key === 'id') {
              newKey = '_id';
            }
          } else {
            // 数据库层到业务层：保留 _id，同时添加 id 字段
            if (key === '_id') {
              // 保留原始的 _id 字段
              transformed._id = value;
              // 同时添加 id 字段，值与 _id 相等
              transformed.id = value;
              continue; // 跳过后续处理，因为已经处理了这个字段
            }
          }

          // 递归处理嵌套对象
          // 避免误处理 Date/RegExp 等特殊对象导致值被清空
          if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof RegExp)) {
            newValue = transform(value);
          }

          transformed[newKey] = newValue;
        }

        return transformed;
      }

      return obj;
    };

    return transform(data);
  }

  /**
   * 针对查询条件进行ID字段映射
   * @param {Object} query 查询条件
   * @param {string} direction 转换方向: 'toDatabase' | 'fromDatabase'
   * @return {Object} 转换后的查询条件
   * @private
   */
  _transformQueryIdFields(query, direction = 'toDatabase') {
    if (!query || typeof query !== 'object') {
      return query;
    }

    const transformQuery = obj => {
      if (Array.isArray(obj)) {
        return obj.map(item => transformQuery(item));
      }

      if (obj && typeof obj === 'object') {
        const transformed = {};

        for (const [key, value] of Object.entries(obj)) {
          let newKey = key;
          let newValue = value;

          // ID字段映射
          if (direction === 'toDatabase') {
            // 业务层 id -> 数据库层 _id
            if (key === 'id') {
              newKey = '_id';
            }
          } else {
            // 数据库层 _id -> 业务层 id
            if (key === '_id') {
              newKey = 'id';
            }
          }

          // 递归处理嵌套对象
          // 避免递归打平 Date/RegExp，防止日期查询值被转换成空对象
          if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof RegExp)) {
            newValue = transformQuery(value);
          }

          transformed[newKey] = newValue;
        }

        return transformed;
      }

      return obj;
    };

    return transformQuery(query);
  }

  /**
   * 转换标准参数为数据库特定参数
   * @param {Object} standardParams 标准参数
   * @param {string} targetDB 目标数据库类型 ('mongodb' | 'mariadb')
   * @param {string} entityName 实体名称
   * @param sequelize
   * @return {Object} 转换后的参数
   */
  transformStandardParams(standardParams, targetDB, entityName, sequelize = null) {
    const validatedParams = this.validator.validate(standardParams);

    if (targetDB === 'mongodb') {
      return this._transformForMongoDB(validatedParams, entityName);
    } else if (targetDB === 'mariadb') {
      return this._transformForMariaDB(validatedParams, entityName, sequelize);
    }

    throw new Error(`Unsupported database type: ${targetDB}`);
  }

  /**
   * 转换为 MongoDB 参数
   * @param {Object} params 标准参数
   * @param {string} entityName 实体名称
   * @return {Object} MongoDB 参数
   * @private
   */
  _transformForMongoDB(params, entityName) {
    return {
      query: this.transformIdFields(this._transformFiltersForMongo(params.filters), 'toDatabase'),
      populate: this._transformPopulateForMongo(params.populate, entityName),
      sort: this._transformSortForMongo(params.sort),
      files: this._transformFieldsForMongo(params.fields),
      pagination: params.pagination,
    };
  }

  /**
   * 转换为 MariaDB 参数
   * @param {Object} params 标准参数
   * @param {string} entityName 实体名称
   * @param {Object} sequelize Sequelize 实例 (可选)
   * @return {Object} MariaDB 查询选项
   * @private
   */
  _transformForMariaDB(params, entityName, sequelize = null) {
    // 检查是否存在关联查询
    const hasJoins = params.populate && params.populate.length > 0;

    return {
      where: this._transformFiltersForMariaDB(params.filters, sequelize, entityName, hasJoins),
      include: this._transformPopulateForMariaDB(params.populate, entityName),
      order: this._transformSortForMariaDB(params.sort),
      attributes: this._transformFieldsForMariaDB(params.fields, entityName),
      pagination: params.pagination,
    };
  }

  /**
   * 转换过滤条件为 MongoDB 查询
   * @param {Object} filters 标准过滤条件
   * @return {Object} MongoDB 查询条件
   * @private
   */
  _transformFiltersForMongo(filters) {
    const mongoQuery = {};

    for (const [field, condition] of Object.entries(filters)) {
      if (field.startsWith('$')) {
        // 处理顶级操作符 ($or, $and 等)
        mongoQuery[field] = this._transformLogicalOperatorForMongo(condition);
      } else {
        mongoQuery[field] = this._transformFieldConditionForMongo(condition);
      }
    }

    // 处理主键转换 id -> _id
    return this._transformQueryIdFields(mongoQuery, 'toDatabase');
  }

  /**
   * 转换过滤条件为 MariaDB 查询
   * @param {Object} filters 标准过滤条件
   * @param {Object} sequelize Sequelize 实例 (可选)
   * @param entityName
   * @param hasJoins
   * @return {Object} MariaDB 查询条件
   * @private
   */
  _transformFiltersForMariaDB(filters, sequelize = null, entityName = null, hasJoins = false) {
    const { Op } = require('sequelize');

    // 🔥 关键修复：使用增强的 buildMariaDBWhereCondition 方法
    // 该方法能正确处理JSON数组字段的$in查询
    if (sequelize) {
      return this.buildMariaDBWhereCondition(filters, Op, sequelize, entityName, hasJoins);
    }

    // 兜底方案：使用原有逻辑（但可能无法正确处理JSON数组字段）
    const mariaQuery = {};

    // 参数验证
    if (!filters || typeof filters !== 'object') {
      return mariaQuery;
    }

    for (const [field, condition] of Object.entries(filters)) {
      if (field.startsWith('$')) {
        // 处理顶级操作符
        mariaQuery[this._getMariaOperator(field)] = this._transformLogicalOperatorForMariaDB(condition);
      } else {
        // 如果条件不是对象（如直接传递的布尔值），先转换为对象格式
        if (typeof condition !== 'object' || condition === null) {
          mariaQuery[field] = this._convertBooleanForMariaDB(condition);
        } else {
          mariaQuery[field] = this._transformFieldConditionForMariaDB(condition);
        }
      }
    }

    // MariaDB 中保持 id 字段不变
    return mariaQuery;
  }

  /**
   * 转换字段条件为 MongoDB 格式
   * @param {*} condition 条件值
   * @return {*} MongoDB 条件
   * @private
   */
  _transformFieldConditionForMongo(condition) {
    if (typeof condition !== 'object' || condition === null) {
      return condition;
    }

    const mongoCondition = {};
    for (const [op, value] of Object.entries(condition)) {
      switch (op) {
        case '$eq':
          return value; // MongoDB 中简单相等不需要 $eq 操作符
        case '$ne':
        case '$gt':
        case '$gte':
        case '$lt':
        case '$lte':
        case '$in':
        case '$nin':
        case '$regex':
        case '$exists':
          mongoCondition[op] = value;
          break;
        default:
          mongoCondition[op] = value;
      }
    }

    return mongoCondition;
  }

  /**
   * 转换字段条件为 MariaDB 格式
   * @param {*} condition 条件值
   * @return {*} MariaDB 条件
   * @private
   */
  _transformFieldConditionForMariaDB(condition) {
    const { Op } = require('sequelize');

    if (typeof condition !== 'object' || condition === null) {
      return condition;
    }

    // 特殊处理：如果条件只有 $options 而没有 $regex，这是无效的查询
    if (condition.$options && !condition.$regex) {
      throw new Error(`Invalid condition: $options requires $regex. Found condition: ${JSON.stringify(condition)}`);
    }

    const mariaCondition = {};
    for (const [op, value] of Object.entries(condition)) {
      switch (op) {
        case '$eq':
          // 特殊处理 null 值：在 MariaDB 中应该使用 IS NULL
          if (value === null) {
            mariaCondition[Op.is] = null;
            break;
          }
          // 检查值的有效性，防止 undefined 传递到 MariaDB 查询
          if (value === undefined) {
            throw new Error(`Invalid value for $eq operator: ${value}`);
          }
          // 处理布尔值转换：true -> 1, false -> 0
          const convertedValue = this._convertBooleanForMariaDB(value);
          return convertedValue; // Sequelize 中简单相等不需要操作符
        case '$ne':
          // 特殊处理 null 值：在 MariaDB 中应该使用 IS NOT NULL
          if (value === null) {
            mariaCondition[Op.not] = null;
            break;
          }
          if (value === undefined) {
            throw new Error(`Invalid value for $ne operator: ${value}`);
          }
          mariaCondition[Op.ne] = this._convertBooleanForMariaDB(value);
          break;
        case '$gt':
          if (value === undefined || value === null) {
            throw new Error(`Invalid value for $gt operator: ${value}`);
          }
          mariaCondition[Op.gt] = this._convertBooleanForMariaDB(value);
          break;
        case '$gte':
          if (value === undefined || value === null) {
            throw new Error(`Invalid value for $gte operator: ${value}`);
          }
          mariaCondition[Op.gte] = this._convertBooleanForMariaDB(value);
          break;
        case '$lt':
          if (value === undefined || value === null) {
            throw new Error(`Invalid value for $lt operator: ${value}`);
          }
          mariaCondition[Op.lt] = this._convertBooleanForMariaDB(value);
          break;
        case '$lte':
          if (value === undefined || value === null) {
            throw new Error(`Invalid value for $lte operator: ${value}`);
          }
          mariaCondition[Op.lte] = this._convertBooleanForMariaDB(value);
          break;
        case '$in':
          // 处理数组中的布尔值转换
          const convertedArray = Array.isArray(value) ? value.map(item => this._convertBooleanForMariaDB(item)) : value;
          mariaCondition[Op.in] = convertedArray;
          break;
        case '$nin':
          // 处理数组中的布尔值转换
          const convertedNinArray = Array.isArray(value)
            ? value.map(item => this._convertBooleanForMariaDB(item))
            : value;
          mariaCondition[Op.notIn] = convertedNinArray;
          break;
        case '$regex':
          // 检查是否有 $options 指示大小写不敏感
          let pattern = value;
          if (pattern instanceof RegExp) {
            pattern = pattern.source;
          }
          // 移除正则表达式的标记
          pattern = pattern.toString().replace(/^\/|\/[gimuy]*$/g, '');

          // 检查同级条件中是否有 $options
          const isCaseInsensitive = condition.$options && condition.$options.includes('i');
          if (isCaseInsensitive) {
            // MySQL/MariaDB 不支持 iLike，使用 like 结合数据库的 collation 设置
            mariaCondition[Op.like] = `%${pattern}%`;
          } else {
            mariaCondition[Op.like] = `%${pattern}%`;
          }
          break;
        case '$options':
          // $options 单独处理，通常与 $regex 搭配使用
          // 此处不需要处理，因为在 $regex 中已经处理了
          break;
        case '$exists':
          // 🔥 修复：$exists: true -> IS NOT NULL, $exists: false -> IS NULL
          if (value) {
            mariaCondition[Op.not] = null;
          } else {
            mariaCondition[Op.is] = null;
          }
          break;
        default:
          mariaCondition[op] = this._convertBooleanForMariaDB(value);
      }
    }

    return mariaCondition;
  }

  /**
   * 将布尔值转换为 MariaDB 兼容的数值
   * @param {*} value 要转换的值
   * @return {*} 转换后的值
   * @private
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
   * 转换 populate 为 MongoDB 格式
   * @param {Array} populate 标准 populate 配置
   * @param {string} entityName 实体名称
   * @return {Array} MongoDB populate 配置
   * @private
   */
  _transformPopulateForMongo(populate, entityName) {
    return populate.map(config => {
      const mongoPopulate = {
        path: config.path,
      };

      if (config.select && config.select.length > 0) {
        // 对 populate 中的字段选择也进行ID映射
        const mongoSelectFields = config.select.map(field => {
          if (field === 'id') {
            return '_id';
          }
          if (field === '-id') {
            return '-_id';
          }
          return field;
        });
        mongoPopulate.select = mongoSelectFields.join(' ');
      }

      if (config.filters && Object.keys(config.filters).length > 0) {
        mongoPopulate.match = this._transformFiltersForMongo(config.filters);
      }

      if (config.populate && config.populate.length > 0) {
        mongoPopulate.populate = this._transformPopulateForMongo(config.populate, entityName);
      }

      if (config.sort && Object.keys(config.sort).length > 0) {
        mongoPopulate.options = {
          sort: this._transformSortForMongo(config.sort),
        };
      }

      if (config.limit > 0) {
        mongoPopulate.options = mongoPopulate.options || {};
        mongoPopulate.options.limit = config.limit;
      }

      return mongoPopulate;
    });
  }

  /**
   * 转换 populate 为 MariaDB include 格式
   * @param {Array} populate 标准 populate 配置
   * @param {string} entityName 实体名称
   * @return {Array} MariaDB include 配置
   * @private
   */
  _transformPopulateForMariaDB(populate, entityName) {
    if (!populate || !Array.isArray(populate)) {
      return [];
    }

    return populate
      .map(config => {
        const relationKey = `${entityName}.${config.path}`;
        const relationConfig = this.relationMappings.get(relationKey);

        if (!relationConfig) {
          console.warn(`Relation mapping not found for ${relationKey}`);
          return null;
        }

        // 处理标准的关联 populate
        const mariaInclude = {
          model: relationConfig.model,
          as: config.path,
          required: false,
        };

        if (config.select && config.select.length > 0) {
          mariaInclude.attributes = config.select;
        }

        if (config.filters && Object.keys(config.filters).length > 0) {
          mariaInclude.where = this._transformFiltersForMariaDB(config.filters);
        }

        if (config.populate && config.populate.length > 0) {
          mariaInclude.include = this._transformPopulateForMariaDB(config.populate, config.path);
        }

        if (config.sort && Object.keys(config.sort).length > 0) {
          mariaInclude.order = this._transformSortForMariaDB(config.sort);
        }

        if (config.limit > 0) {
          mariaInclude.limit = config.limit;
        }

        return mariaInclude;
      })
      .filter(Boolean);
  }

  /**
   * 转换排序为 MongoDB 格式
   * @param {Array} sort 标准排序配置
   * @return {Object} MongoDB 排序对象
   * @private
   */
  _transformSortForMongo(sort) {
    const mongoSort = {};

    sort.forEach(config => {
      mongoSort[config.field] = config.order === 'asc' ? 1 : -1;
    });

    return mongoSort;
  }

  /**
   * 转换排序为 MariaDB 格式
   * @param {Array} sort 标准排序配置
   * @return {Array} MariaDB 排序数组
   * @private
   */
  _transformSortForMariaDB(sort) {
    if (!sort || !Array.isArray(sort)) {
      return [];
    }

    return sort.map(config => [config.field, config.order.toUpperCase()]);
  }

  /**
   * 转换字段选择为 MongoDB 格式
   * @param {Array} fields 字段数组
   * @return {string} MongoDB 字段选择字符串
   * @private
   */
  _transformFieldsForMongo(fields) {
    if (!fields || fields.length === 0) {
      return null;
    }

    // 将业务层的 id 字段转换为 MongoDB 的 _id 字段
    const mongoFields = fields.map(field => {
      if (field === 'id') {
        return '_id';
      }
      if (field === '-id') {
        return '-_id';
      }
      return field;
    });

    return mongoFields.join(' ');
  }

  /**
   * 转换字段选择为 MariaDB 格式
   * @param {Array} fields 字段数组
   * @return {Array} MariaDB 字段数组
   * @private
   */
  /**
   * 获取实体的关联字段列表
   * 通过检查已注册的关联关系来动态确定关联字段
   * @param {string} entityName 实体名称
   * @return {Array} 关联字段列表
   * @private
   */
  _getRelationFields(entityName) {
    const relationFields = [];

    // 遍历已注册的关联关系
    for (const [key, config] of this.relationMappings.entries()) {
      if (key.startsWith(`${entityName}.`)) {
        const fieldName = key.substring(entityName.length + 1);
        relationFields.push(fieldName);
      }
    }

    return relationFields;
  }

  _transformFieldsForMariaDB(fields, entityName = 'Unknown') {
    if (!fields || fields.length === 0) {
      return undefined;
    }

    // 处理排除字段（以 - 开头）
    const excludeFields = fields
      .filter(field => field.startsWith('-'))
      .map(field => field.substring(1))
      .map(field => (field === 'id' ? 'id' : field)); // 转换 id 为 id
    const includeFields = fields.filter(field => !field.startsWith('-')).map(field => (field === 'id' ? 'id' : field)); // 转换 id 为 id

    // 🔥 动态获取关联字段，而不是硬编码
    const relationFields = this._getRelationFields(entityName);

    if (excludeFields.length > 0) {
      // 对于排除字段，也要过滤关联字段
      const filteredExcludeFields = excludeFields.filter(field => !relationFields.includes(field));
      return filteredExcludeFields.length > 0 ? { exclude: filteredExcludeFields } : undefined;
    }

    // 对于包含字段，过滤掉关联字段
    const filteredIncludeFields = includeFields.filter(field => !relationFields.includes(field));
    return filteredIncludeFields.length > 0 ? filteredIncludeFields : undefined;
  }

  /**
   * 获取 MariaDB 操作符
   * @param {string} standardOp 标准操作符
   * @return {Symbol} MariaDB 操作符
   * @private
   */
  _getMariaOperator(standardOp) {
    const { Op } = require('sequelize');

    switch (standardOp) {
      case '$or':
        return Op.or;
      case '$and':
        return Op.and;
      default:
        return standardOp;
    }
  }

  /**
   * 转换逻辑操作符为 MongoDB 格式
   * @param {Array} conditions 条件数组
   * @return {Array} MongoDB 条件数组
   * @private
   */
  _transformLogicalOperatorForMongo(conditions) {
    if (!Array.isArray(conditions)) {
      return conditions;
    }

    return conditions.map(condition => this._transformFiltersForMongo(condition));
  }

  /**
   * 转换逻辑操作符为 MariaDB 格式
   * @param {Array} conditions 条件数组
   * @return {Array} MariaDB 条件数组
   * @private
   */
  _transformLogicalOperatorForMariaDB(conditions) {
    if (!Array.isArray(conditions)) {
      return conditions;
    }

    return conditions.map(condition => this._transformFiltersForMariaDB(condition));
  }

  /**
   * 转换查询结果为统一格式
   * @param {*} result 数据库查询结果
   * @param {string} sourceDB 源数据库类型
   * @return {*} 统一格式的结果
   */
  transformResult(result, sourceDB) {
    if (!result) {
      return result;
    }

    if (sourceDB === 'mongodb') {
      return this._transformMongoResult(result);
    } else if (sourceDB === 'mariadb') {
      return this._transformMariaResult(result);
    }

    return result;
  }

  /**
   * 转换 MongoDB 结果
   * @param {*} result MongoDB 查询结果
   * @return {*} 统一格式结果
   * @private
   */
  _transformMongoResult(result) {
    if (Array.isArray(result)) {
      return result.map(item => this.transformIdFields(this.transformToUnifiedFormat(item), 'fromDatabase'));
    }

    if (result && result.docs) {
      // 分页结果
      return {
        docs: result.docs.map(item => this.transformIdFields(this.transformToUnifiedFormat(item), 'fromDatabase')),
        pageInfo: result.pageInfo,
      };
    }

    return this.transformIdFields(this.transformToUnifiedFormat(result), 'fromDatabase');
  }

  /**
   * 转换 MariaDB 结果
   * @param {*} result MariaDB 查询结果
   * @return {*} 统一格式结果
   * @private
   */
  _transformMariaResult(result) {
    // 统一处理 Sequelize 实例，转换为普通对象
    // 这样可以确保手动添加的属性（如 children）被正确保留
    if (Array.isArray(result)) {
      return result.map(item => (item && typeof item.toJSON === 'function' ? item.toJSON() : item));
    }

    if (result && result.docs) {
      // 分页结果
      return {
        docs: result.docs.map(item => (item && typeof item.toJSON === 'function' ? item.toJSON() : item)),
        pageInfo: result.pageInfo,
      };
    }

    // 单个结果
    if (result && typeof result.toJSON === 'function') {
      return result.toJSON();
    }

    return result;
  }

  // ========================================
  // 🔥 Phase3: 查询增强功能
  // ========================================

  /**
   * 🔥 Phase3: 计算查询复杂度
   * 用于识别可能导致性能问题的复杂查询
   * @param {Object} filters 查询条件
   * @param {number} depth 当前深度
   * @return {number} 复杂度分数
   */
  _calculateQueryComplexity(filters, depth = 0) {
    if (!filters || typeof filters !== 'object') {
      return 1;
    }

    let complexity = 1;

    for (const [key, value] of Object.entries(filters)) {
      // 逻辑操作符增加复杂度
      if (key === '$or' || key === '$and' || key === '$nor') {
        if (Array.isArray(value)) {
          // 逻辑操作符基础复杂度
          complexity += value.length * 2;

          // 递归计算子查询复杂度
          for (const subFilter of value) {
            complexity += this._calculateQueryComplexity(subFilter, depth + 1);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // 普通字段的操作符数量
        if (!Array.isArray(value)) {
          complexity += Object.keys(value).length;
        }
      }
    }

    // 深度惩罚：每增加一层深度，复杂度乘以1.5
    if (depth > 0) {
      complexity = Math.floor(complexity * Math.pow(1.5, depth));
    }

    return complexity;
  }

  /**
   * 🔥 Phase3: 验证查询复杂度
   * 如果查询过于复杂，抛出异常
   * @param {Object} filters 查询条件
   * @param {number} maxComplexity 最大复杂度（可选，默认使用配置值）
   * @return {number} 查询复杂度
   * @throws {Error} 当查询过于复杂时抛出
   */
  _validateQueryComplexity(filters, maxComplexity = null) {
    // 仅在配置启用时生效
    if (!this.config.enableComplexityCheck) {
      return 0;
    }

    const complexity = this._calculateQueryComplexity(filters);
    const effectiveMaxComplexity = maxComplexity !== null ? maxComplexity : this.config.maxQueryComplexity;

    if (complexity > effectiveMaxComplexity) {
      throw new Error(
        `[EnhancedDataTransformer] Query too complex (complexity: ${complexity}, max: ${effectiveMaxComplexity}). ` +
          'Please simplify your query or split it into multiple queries. ' +
          'Complex queries may cause performance issues.'
      );
    }

    return complexity;
  }

  /**
   * 🔥 Phase3: 统一日期时区处理
   * 将各种日期格式转换为标准UTC ISO字符串
   * @param {*} value 日期值（Date对象、字符串或时间戳）
   * @param {string} timezone 目标时区（默认UTC）
   * @return {string|*} 标准化的日期字符串或原值
   */
  _normalizeDateValue(value, timezone = null) {
    // 仅在配置启用时生效
    if (!this.config.enableDateNormalization) {
      return value;
    }

    const effectiveTimezone = timezone || this.config.dateTimezone;

    // 1. 处理Date对象
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        // 无效日期，返回原值
        return value;
      }
      // 转换为UTC ISO字符串
      return value.toISOString();
    }

    // 2. 处理字符串日期
    if (typeof value === 'string' && value.trim() !== '') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (error) {
        // 不是有效的日期字符串，返回原值
      }
    }

    // 3. 处理时间戳（毫秒）
    if (typeof value === 'number' && value > 0) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (error) {
        // 无效时间戳，返回原值
      }
    }

    // 其他类型返回原值
    return value;
  }

  /**
   * 🔥 Phase3: 检测字段是否为日期类型
   * 用于自动应用日期标准化
   * @param {string} fieldName 字段名
   * @param {string} entityName 实体名称（可选）
   * @return {boolean} 是否为日期字段
   */
  _isDateField(fieldName, entityName = null) {
    if (!fieldName) {
      return false;
    }

    // 🔥 Phase3修复：只检测驼峰命名的日期字段，不包含下划线
    // 这样可以避免误判（如 "status" 不会因为包含 "at" 而被识别为日期）
    if (fieldName.includes('_')) {
      return false; // 排除下划线命名法（如 created_at）
    }

    // 常见的日期字段名模式（驼峰命名）
    const dateFieldPatterns = [
      'createdAt',
      'updatedAt',
      'deletedAt',
      'publishAt',
      'expireAt',
      'startTime',
      'endTime',
      'date',
      'time',
      'timestamp',
      'birthday',
      'deadline',
    ];

    const lowerFieldName = fieldName.toLowerCase();

    // 精确匹配
    if (dateFieldPatterns.some(pattern => pattern.toLowerCase() === lowerFieldName)) {
      return true;
    }

    // 模糊匹配：字段名包含日期相关关键词（但要求是完整单词）
    // 使用更精确的匹配规则，避免误判
    if (lowerFieldName.includes('date') || lowerFieldName.includes('time') || lowerFieldName.includes('timestamp')) {
      return true;
    }

    // 以特定后缀结尾（必须是驼峰命名模式，如 publishAt, expireAt）
    // 但排除简单的 "at" 单词（如 "status", "cat"）
    if (lowerFieldName.length > 2) {
      // 检查是否以 "At" 结尾（驼峰命名）或 "Date"/"Time" 结尾
      const endsWithAt = lowerFieldName.endsWith('at') && fieldName.match(/[a-z][A-Z]at$/); // 驼峰模式
      const endsWithDate = lowerFieldName.endsWith('date');
      const endsWithTime = lowerFieldName.endsWith('time');

      if (endsWithAt || endsWithDate || endsWithTime) {
        return true;
      }
    }

    return false;
  }

  /**
   * 🔥 Phase3: 转换日期条件
   * 对查询条件中的日期字段自动应用标准化
   * @param {Object} condition 查询条件
   * @param {string} fieldName 字段名
   * @param {string} entityName 实体名称
   * @return {Object} 转换后的条件
   */
  _transformDateCondition(condition, fieldName, entityName = null) {
    // 仅在配置启用且字段是日期字段时生效
    if (!this.config.enableDateNormalization || !this._isDateField(fieldName, entityName)) {
      return condition;
    }

    if (typeof condition !== 'object' || condition === null) {
      // 简单值，直接标准化
      return this._normalizeDateValue(condition);
    }

    // 处理操作符
    const result = {};
    for (const [operator, value] of Object.entries(condition)) {
      if (['$gte', '$gt', '$lte', '$lt', '$eq', '$ne'].includes(operator)) {
        result[operator] = this._normalizeDateValue(value);
      } else {
        result[operator] = value;
      }
    }

    return result;
  }
}

module.exports = EnhancedDataTransformer;
