/*
 * @Author: Claude Code
 * @Date: 2024-08-17
 * @Description: 通用唯一性检查工具类
 * 用于去重各模块中的唯一性检查逻辑
 */

'use strict';

/**
 * 通用唯一性检查工具类
 * 统一处理各模块的唯一性验证逻辑，避免代码重复
 */
class UniqueChecker {
  /**
   * 检查单个字段的唯一性
   * @param {Object} repository Repository实例
   * @param {String} field 字段名
   * @param {*} value 字段值
   * @param {String|null} excludeId 排除的ID（更新时使用）
   * @return {Promise<Boolean>} true表示唯一，false表示已存在
   */
  static async checkFieldUnique(repository, field, value, excludeId = null) {
    try {
      if (!value || value === '') {
        return true; // 空值认为是唯一的
      }

      // 构建查询条件
      const query = { [field]: value };

      // 🔥 修复：使用标准格式 $ne，由 transformer 转换为对应数据库的格式
      // 这样避免了直接使用 Sequelize 操作符导致的转换问题
      if (excludeId) {
        // 支持MongoDB和MariaDB的ID字段
        if (repository.constructor.name.includes('Mongo')) {
          query._id = { $ne: excludeId };
        } else {
          // MariaDB：使用标准格式 $ne，由 EnhancedDataTransformer 转换为 Op.ne
          query.id = { $ne: excludeId };
        }
      }

      // 执行计数查询
      const count = await repository.count(query);
      return count === 0;
    } catch (error) {
      console.error('UniqueChecker.checkFieldUnique error:', error);
      // 发生错误时，为了安全起见，认为不唯一
      return false;
    }
  }

  /**
   * 批量检查多个字段的唯一性
   * @param {Object} repository Repository实例
   * @param {Object} fields 字段对象 {fieldName: value}
   * @param {String|null} excludeId 排除的ID（更新时使用）
   * @return {Promise<Object>} 返回每个字段的唯一性检查结果 {fieldName: boolean}
   */
  static async checkMultipleFieldsUnique(repository, fields, excludeId = null) {
    try {
      const promises = Object.entries(fields).map(([field, value]) =>
        this.checkFieldUnique(repository, field, value, excludeId)
      );

      const results = await Promise.all(promises);

      return Object.keys(fields).reduce((acc, field, index) => {
        acc[field] = results[index];
        return acc;
      }, {});
    } catch (error) {
      console.error('UniqueChecker.checkMultipleFieldsUnique error:', error);
      // 发生错误时，为了安全起见，认为所有字段都不唯一
      return Object.keys(fields).reduce((acc, field) => {
        acc[field] = false;
        return acc;
      }, {});
    }
  }

  /**
   * 检查字段唯一性并抛出错误（如果不唯一）
   * @param {Object} repository Repository实例
   * @param {String} field 字段名
   * @param {*} value 字段值
   * @param {String|null} excludeId 排除的ID
   * @param {String} fieldDisplayName 字段显示名称（用于错误信息）
   * @throws {Error} 如果字段不唯一则抛出错误
   */
  static async validateFieldUnique(repository, field, value, excludeId = null, fieldDisplayName = null) {
    const isUnique = await this.checkFieldUnique(repository, field, value, excludeId);

    if (!isUnique) {
      const displayName = fieldDisplayName || field;
      const { ErrorFactory } = require('../exceptions');
      throw ErrorFactory.createUniqueConstraintError(`${displayName} "${value}" 已存在，请使用其他值`);
    }
  }

  /**
   * 批量验证字段唯一性并抛出错误（如果有不唯一的）
   * @param {Object} repository Repository实例
   * @param {Object} fields 字段对象 {fieldName: value}
   * @param {String|null} excludeId 排除的ID
   * @param {Object} fieldDisplayNames 字段显示名称映射 {fieldName: displayName}
   * @throws {Error} 如果有字段不唯一则抛出错误
   */
  static async validateMultipleFieldsUnique(repository, fields, excludeId = null, fieldDisplayNames = {}) {
    const results = await this.checkMultipleFieldsUnique(repository, fields, excludeId);

    const duplicateFields = Object.entries(results)
      .filter(([, isUnique]) => !isUnique)
      .map(([field]) => {
        const displayName = fieldDisplayNames[field] || field;
        const value = fields[field];
        return `${displayName} "${value}"`;
      });

    if (duplicateFields.length > 0) {
      const { ErrorFactory } = require('../exceptions');
      throw ErrorFactory.createUniqueConstraintError(`以下字段已存在：${duplicateFields.join('、')}，请使用其他值`);
    }
  }

  /**
   * Admin模块专用的用户名唯一性检查
   * @param {Object} adminRepository Admin Repository实例
   * @param {String} userName 用户名
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkUserNameUnique(adminRepository, userName, excludeId = null) {
    return await this.checkFieldUnique(adminRepository, 'userName', userName, excludeId);
  }

  /**
   * Admin模块专用的邮箱唯一性检查
   * @param {Object} adminRepository Admin Repository实例
   * @param {String} userEmail 邮箱
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkEmailUnique(adminRepository, userEmail, excludeId = null) {
    return await this.checkFieldUnique(adminRepository, 'userEmail', userEmail, excludeId);
  }

  /**
   * User模块专用的邮箱唯一性检查
   * @param {Object} userRepository User Repository实例
   * @param {String} email 邮箱
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkUserEmailUnique(userRepository, email, excludeId = null) {
    return await this.checkFieldUnique(userRepository, 'email', email, excludeId);
  }

  /**
   * Admin模块专用的手机号唯一性检查
   * @param {Object} adminRepository Admin Repository实例
   * @param {String} userPhone 手机号
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkPhoneUnique(adminRepository, userPhone, excludeId = null) {
    return await this.checkFieldUnique(adminRepository, 'userPhone', userPhone, excludeId);
  }

  /**
   * Role模块专用的角色编码唯一性检查
   * @param {Object} roleRepository Role Repository实例
   * @param {String} roleCode 角色编码
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkRoleCodeUnique(roleRepository, roleCode, excludeId = null) {
    return await this.checkFieldUnique(roleRepository, 'roleCode', roleCode, excludeId);
  }

  /**
   * Menu模块专用的路由路径唯一性检查
   * @param {Object} menuRepository Menu Repository实例
   * @param {String} routePath 路由路径
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkRoutePathUnique(menuRepository, routePath, excludeId = null) {
    return await this.checkFieldUnique(menuRepository, 'routePath', routePath, excludeId);
  }

  /**
   * Menu模块专用的路由名称唯一性检查
   * @param {Object} menuRepository Menu Repository实例
   * @param {String} routeName 路由名称
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkRouteNameUnique(menuRepository, routeName, excludeId = null) {
    return await this.checkFieldUnique(menuRepository, 'routeName', routeName, excludeId);
  }

  /**
   * ContentCategory模块专用的分类名称唯一性检查（同级别下）
   * @param {Object} categoryRepository ContentCategory Repository实例
   * @param {String} name 分类名称
   * @param {String} parentId 父级ID
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkCategoryNameUnique(categoryRepository, name, parentId = '0', excludeId = null) {
    try {
      if (!name || name === '') {
        return true; // 空值认为是唯一的
      }

      // 构建查询条件 - 同级别下的名称唯一性
      const query = { name, parentId };

      // 🔥 修复：使用标准格式 $ne，由 transformer 转换为对应数据库的格式
      // 这样避免了直接使用 Sequelize 操作符导致的转换问题
      if (excludeId) {
        // 支持MongoDB和MariaDB的ID字段
        if (categoryRepository.constructor.name.includes('Mongo')) {
          query._id = { $ne: excludeId };
        } else {
          // MariaDB：使用标准格式 $ne，由 EnhancedDataTransformer 转换为 Op.ne
          query.id = { $ne: excludeId };
        }
      }

      // 执行计数查询
      const count = await categoryRepository.count(query);
      return count === 0;
    } catch (error) {
      console.error('UniqueChecker.checkCategoryNameUnique error:', error);
      return false;
    }
  }

  /**
   * ContentCategory模块专用的默认URL唯一性检查
   * @param {Object} categoryRepository ContentCategory Repository实例
   * @param {String} defaultUrl 默认URL
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkCategoryDefaultUrlUnique(categoryRepository, defaultUrl, excludeId = null) {
    return await this.checkFieldUnique(categoryRepository, 'defaultUrl', defaultUrl, excludeId);
  }

  /**
   * ContentTag模块专用的标签名称唯一性检查
   * @param {Object} tagRepository ContentTag Repository实例
   * @param {String} name 标签名称
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkTagNameUnique(tagRepository, name, excludeId = null) {
    return await this.checkFieldUnique(tagRepository, 'name', name, excludeId);
  }

  /**
   * ContentTag模块专用的标签别名唯一性检查
   * @param {Object} tagRepository ContentTag Repository实例
   * @param {String} alias 标签别名
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} true表示唯一
   */
  static async checkTagAliasUnique(tagRepository, alias, excludeId = null) {
    return await this.checkFieldUnique(tagRepository, 'alias', alias, excludeId);
  }

  // ===== MailTemplate 邮件模板相关唯一性检查 =====

  /**
   * 检查邮件模板标题是否唯一
   * @param {Object} repository Repository实例
   * @param {String} title 模板标题
   * @param {String|null} excludeId 排除的ID（更新时使用）
   * @return {Promise<Boolean>} true表示唯一，false表示已存在
   */
  static async checkMailTemplateTitleUnique(repository, title, excludeId = null) {
    return await this.checkFieldUnique(repository, 'title', title, excludeId);
  }

  // ===== Template 模块唯一性检查 =====

  /**
   * 检查模板主题标识符唯一性
   * @param {Object} repository Repository实例
   * @param {String} slug 主题标识符
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  static async checkTemplateSlugUnique(repository, slug, excludeId = null) {
    return await this.checkFieldUnique(repository, 'slug', slug, excludeId);
  }

  /**
   * 检查模板主题名称唯一性
   * @param {Object} repository Repository实例
   * @param {String} name 主题名称
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  static async checkTemplateNameUnique(repository, name, excludeId = null) {
    return await this.checkFieldUnique(repository, 'name', name, excludeId);
  }

  // ===== Plugin 模块唯一性检查 =====

  /**
   * 检查插件别名唯一性
   * @param {Object} repository Repository实例
   * @param {String} alias 插件别名
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  static async checkPluginAliasUnique(repository, alias, excludeId = null) {
    return await this.checkFieldUnique(repository, 'alias', alias, excludeId);
  }

  /**
   * 检查插件包名唯一性
   * @param {Object} repository Repository实例
   * @param {String} pkgName 插件包名
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  static async checkPluginPkgNameUnique(repository, pkgName, excludeId = null) {
    return await this.checkFieldUnique(repository, 'pkgName', pkgName, excludeId);
  }

  /**
   * 检查插件ID唯一性
   * @param {Object} repository Repository实例
   * @param {String} pluginId 插件ID
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  static async checkPluginIdUnique(repository, pluginId, excludeId = null) {
    return await this.checkFieldUnique(repository, 'pluginId', pluginId, excludeId);
  }

  // ===== ApiKey 模块唯一性检查 =====

  /**
   * 检查API Key的key字段唯一性
   * @param {Object} repository Repository实例
   * @param {String} key API Key
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  static async checkApiKeyUnique(repository, key, excludeId = null) {
    return await this.checkFieldUnique(repository, 'key', key, excludeId);
  }

  /**
   * 检查API Key名称唯一性（用户维度下）
   * @param {Object} repository Repository实例
   * @param {String} name API Key名称
   * @param {String} userId 用户ID
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  static async checkApiKeyNameUnique(repository, name, userId, excludeId = null) {
    try {
      if (!name || name === '') {
        return true; // 空值认为是唯一的
      }

      // 构建查询条件 - 同一用户下的名称唯一性
      const query = { name, userId };

      // 🔥 修复：使用标准格式 $ne，由 transformer 转换为对应数据库的格式
      // 这样避免了直接使用 Sequelize 操作符导致的转换问题
      if (excludeId) {
        // 支持MongoDB和MariaDB的ID字段
        if (repository.constructor.name.includes('Mongo')) {
          query._id = { $ne: excludeId };
        } else {
          // MariaDB：使用标准格式 $ne，由 EnhancedDataTransformer 转换为 Op.ne
          query.id = { $ne: excludeId };
        }
      }

      // 执行计数查询
      const count = await repository.count(query);
      return count === 0;
    } catch (error) {
      console.error('UniqueChecker.checkApiKeyNameUnique error:', error);
      return false;
    }
  }

  // ===== Ads 模块唯一性检查 =====

  /**
   * 检查广告名称唯一性
   * @param {Object} repository Repository实例
   * @param {String} name 广告名称
   * @param {String|null} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  static async checkAdsNameUnique(repository, name, excludeId = null) {
    return await this.checkFieldUnique(repository, 'name', name, excludeId);
  }
}

module.exports = UniqueChecker;
