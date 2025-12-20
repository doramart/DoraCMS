/*
 * @Author: Claude Code
 * @Date: 2024-08-17
 * @Description: 密码加密工具类
 * 统一处理系统中的密码加密、解密和验证逻辑
 */

'use strict';

const CryptoJS = require('crypto-js');

/**
 * 密码加密工具类
 * 提供统一的密码加密、解密和验证方法
 */
class CryptoUtil {
  /**
   * 加密密码
   * @param {String} password 明文密码
   * @param {String} key 加密密钥
   * @return {String} 加密后的密码
   */
  static encryptPassword(password, key) {
    try {
      if (!password || !key) {
        throw new Error('密码和密钥不能为空');
      }
      return CryptoJS.AES.encrypt(password, key).toString();
    } catch (error) {
      console.error('Password encryption failed:', error);
      throw new Error('密码加密失败');
    }
  }

  /**
   * 解密密码
   * @param {String} encryptedPassword 加密后的密码
   * @param {String} key 解密密钥
   * @return {String|null} 解密后的明文密码，失败返回null
   */
  static decryptPassword(encryptedPassword, key) {
    try {
      if (!encryptedPassword || !key) {
        return null;
      }

      const bytes = CryptoJS.AES.decrypt(encryptedPassword, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      // 如果解密结果为空，说明解密失败
      return decrypted || null;
    } catch (error) {
      console.error('Password decryption failed:', error);
      return null;
    }
  }

  /**
   * 验证密码
   * @param {String} plainPassword 明文密码
   * @param {String} encryptedPassword 加密后的密码
   * @param {String} key 密钥
   * @return {Boolean} 密码是否匹配
   */
  static verifyPassword(plainPassword, encryptedPassword, key) {
    try {
      if (!plainPassword || !encryptedPassword || !key) {
        return false;
      }

      const decrypted = this.decryptPassword(encryptedPassword, key);
      return decrypted === plainPassword;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * 生成随机密码
   * @param {Number} length 密码长度，默认12位
   * @param {Object} options 选项配置
   * @param {Boolean} options.includeUppercase 是否包含大写字母，默认true
   * @param {Boolean} options.includeLowercase 是否包含小写字母，默认true
   * @param {Boolean} options.includeNumbers 是否包含数字，默认true
   * @param {Boolean} options.includeSymbols 是否包含符号，默认false
   * @return {String} 生成的随机密码
   */
  static generateRandomPassword(length = 12, options = {}) {
    const { includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSymbols = false } = options;

    let charset = '';

    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      throw new Error('至少需要选择一种字符类型');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  /**
   * 验证密码强度
   * @param {String} password 密码
   * @param {Object} rules 验证规则
   * @param {Number} rules.minLength 最小长度，默认6
   * @param {Boolean} rules.requireUppercase 是否要求大写字母，默认false
   * @param {Boolean} rules.requireLowercase 是否要求小写字母，默认false
   * @param {Boolean} rules.requireNumbers 是否要求数字，默认false
   * @param {Boolean} rules.requireSymbols 是否要求符号，默认false
   * @return {Object} 验证结果 {isValid: boolean, errors: string[]}
   */
  static validatePasswordStrength(password, rules = {}) {
    const {
      minLength = 6,
      requireUppercase = false,
      requireLowercase = false,
      requireNumbers = false,
      requireSymbols = false,
    } = rules;

    const errors = [];

    if (!password) {
      errors.push('密码不能为空');
      return { isValid: false, errors };
    }

    if (password.length < minLength) {
      errors.push(`密码长度不能少于${minLength}位`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }

    if (requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('密码必须包含特殊符号');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 计算密码强度等级
   * @param {String} password 密码
   * @return {Object} 强度信息 {level: string, score: number, description: string}
   */
  static calculatePasswordStrength(password) {
    if (!password) {
      return { level: 'none', score: 0, description: '无密码' };
    }

    let score = 0;

    // 长度加分
    if (password.length >= 8) score += 25;
    else if (password.length >= 6) score += 10;

    // 字符类型加分
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 25;

    // 复杂度加分
    if (password.length >= 12) score += 10;
    if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) score += 5;
    if (/\d.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]|[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*\d/.test(password))
      score += 5;

    // 确定等级
    let level, description;
    if (score >= 80) {
      level = 'very_strong';
      description = '非常强';
    } else if (score >= 60) {
      level = 'strong';
      description = '强';
    } else if (score >= 40) {
      level = 'medium';
      description = '中等';
    } else if (score >= 20) {
      level = 'weak';
      description = '弱';
    } else {
      level = 'very_weak';
      description = '非常弱';
    }

    return { level, score, description };
  }

  /**
   * 通用字符串加密
   * @param {String} text 要加密的文本
   * @param {String} key 加密密钥
   * @return {String} 加密后的字符串
   */
  static encrypt(text, key) {
    try {
      if (!text || !key) {
        throw new Error('文本和密钥不能为空');
      }
      return CryptoJS.AES.encrypt(text, key).toString();
    } catch (error) {
      console.error('Text encryption failed:', error);
      throw new Error('文本加密失败');
    }
  }

  /**
   * 通用字符串解密
   * @param {String} encryptedText 加密后的文本
   * @param {String} key 解密密钥
   * @return {String|null} 解密后的文本，失败返回null
   */
  static decrypt(encryptedText, key) {
    try {
      if (!encryptedText || !key) {
        return null;
      }

      const bytes = CryptoJS.AES.decrypt(encryptedText, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      return decrypted || null;
    } catch (error) {
      console.error('Text decryption failed:', error);
      return null;
    }
  }

  /**
   * 生成MD5哈希
   * @param {String} text 要哈希的文本
   * @return {String} MD5哈希值
   */
  static md5(text) {
    try {
      if (!text) {
        throw new Error('文本不能为空');
      }
      return CryptoJS.MD5(text).toString();
    } catch (error) {
      console.error('MD5 hash failed:', error);
      throw new Error('MD5哈希计算失败');
    }
  }

  /**
   * 生成SHA256哈希
   * @param {String} text 要哈希的文本
   * @return {String} SHA256哈希值
   */
  static sha256(text) {
    try {
      if (!text) {
        throw new Error('文本不能为空');
      }
      return CryptoJS.SHA256(text).toString();
    } catch (error) {
      console.error('SHA256 hash failed:', error);
      throw new Error('SHA256哈希计算失败');
    }
  }
}

module.exports = CryptoUtil;
