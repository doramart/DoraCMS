/**
 * API Key 加密/解密工具类
 * 使用 AES-256-CBC 加密算法
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const crypto = require('crypto');

class Encryption {
  /**
   * 构造函数
   * @param {Object} app - Egg Application 实例
   */
  constructor(app) {
    this.app = app;

    // 从环境变量或配置文件读取加密密钥
    // 优先级：环境变量 > config.keys
    this.secretKey = process.env.ENCRYPTION_SECRET_KEY || app.config.keys;

    // 加密算法
    this.algorithm = 'aes-256-cbc';

    // 验证密钥长度
    if (!this.secretKey || this.secretKey.length < 32) {
      app.logger.warn('[Encryption] Secret key is too short, should be at least 32 characters. Using default key.');
    }
  }

  /**
   * 加密 API Key
   * @param {String} text - 明文
   * @return {String} 密文（格式：iv:encrypted）
   */
  encrypt(text) {
    if (!text) return '';

    try {
      // 生成随机 IV（初始化向量）
      const iv = crypto.randomBytes(16);

      // 使用 scrypt 从密钥派生固定长度的 key
      const key = crypto.scryptSync(this.secretKey, 'salt', 32);

      // 创建加密器
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      // 加密
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // 返回 iv:encrypted 格式（便于解密时使用相同的 IV）
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.app.logger.error('[Encryption] encrypt failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * 解密 API Key
   * @param {String} text - 密文（格式：iv:encrypted）
   * @return {String} 明文
   */
  decrypt(text) {
    if (!text) return '';

    try {
      // 分割 IV 和加密内容
      const parts = text.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      // 使用相同的方式派生 key
      const key = crypto.scryptSync(this.secretKey, 'salt', 32);

      // 创建解密器
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

      // 解密
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.app.logger.error('[Encryption] decrypt failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * 掩码显示（用于界面展示）
   * 将 API Key 部分隐藏，只显示前后各4位
   *
   * @param {String} apiKey - API Key
   * @return {String} 掩码后的 Key（如：sk-AB****CD）
   */
  mask(apiKey) {
    if (!apiKey || apiKey.length < 8) {
      return '********';
    }

    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    return `${start}****${end}`;
  }

  /**
   * 验证加密文本格式是否正确
   * @param {String} text - 加密文本
   * @return {Boolean}
   */
  isValidEncryptedFormat(text) {
    if (!text) return false;

    const parts = text.split(':');
    if (parts.length !== 2) return false;

    // 验证 IV 长度（应该是32个hex字符，即16字节）
    if (parts[0].length !== 32) return false;

    // 验证加密内容是hex格式
    const hexPattern = /^[0-9a-f]+$/i;
    return hexPattern.test(parts[0]) && hexPattern.test(parts[1]);
  }

  /**
   * 生成随机密钥（用于初始化配置）
   * @param {Number} length - 密钥长度（默认32）
   * @return {String}
   */
  static generateSecretKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 哈希 API Key（用于去重检查，不可逆）
   * @param {String} apiKey - API Key
   * @return {String} 哈希值
   */
  hash(apiKey) {
    if (!apiKey) return '';

    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}

module.exports = Encryption;
