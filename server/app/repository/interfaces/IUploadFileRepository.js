/**
 * UploadFile Repository 接口定义
 * 定义上传文件相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IUploadFileRepository extends IBaseRepository {
  /**
   * 根据上传类型查找配置
   * @param {String} type 上传类型 ('local', 'qn', 'oss')
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 上传配置记录
   */
  async findByType(type, options = {}) {
    throw new Error('Method findByType() must be implemented');
  }

  /**
   * 获取默认上传配置
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 默认上传配置
   */
  async getDefaultConfig(options = {}) {
    throw new Error('Method getDefaultConfig() must be implemented');
  }

  /**
   * 创建或更新上传配置
   * @param {Object} configData 配置数据
   * @return {Promise<Object>} 配置记录
   */
  async createOrUpdateConfig(configData) {
    throw new Error('Method createOrUpdateConfig() must be implemented');
  }

  /**
   * 验证上传配置的有效性
   * @param {String} type 上传类型
   * @param {Object} config 配置对象
   * @return {Promise<Boolean>} 配置是否有效
   */
  async validateConfig(type, config) {
    throw new Error('Method validateConfig() must be implemented');
  }

  /**
   * 获取七牛云配置
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 七牛云配置
   */
  async getQiniuConfig(options = {}) {
    throw new Error('Method getQiniuConfig() must be implemented');
  }

  /**
   * 获取阿里云OSS配置
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 阿里云OSS配置
   */
  async getOssConfig(options = {}) {
    throw new Error('Method getOssConfig() must be implemented');
  }

  /**
   * 获取本地存储配置
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 本地存储配置
   */
  async getLocalConfig(options = {}) {
    throw new Error('Method getLocalConfig() must be implemented');
  }

  /**
   * 更新上传配置
   * @param {String} id 配置ID
   * @param {Object} configData 配置数据
   * @return {Promise<Object>} 更新后的配置
   */
  async updateUploadConfig(id, configData) {
    throw new Error('Method updateUploadConfig() must be implemented');
  }

  /**
   * 检查配置是否存在
   * @param {String} type 上传类型
   * @return {Promise<Boolean>} 是否存在
   */
  async configExists(type) {
    throw new Error('Method configExists() must be implemented');
  }

  /**
   * 获取所有上传配置
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Array>} 所有配置列表
   */
  async getAllConfigs(options = {}) {
    throw new Error('Method getAllConfigs() must be implemented');
  }

  /**
   * 删除上传配置
   * @param {String} id 配置ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteConfig(id) {
    throw new Error('Method deleteConfig() must be implemented');
  }

  /**
   * 批量删除上传配置
   * @param {Array} ids 配置ID数组
   * @return {Promise<Object>} 删除结果
   */
  async deleteConfigs(ids) {
    throw new Error('Method deleteConfigs() must be implemented');
  }
}

module.exports = IUploadFileRepository;
