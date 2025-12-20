/**
 * UploadFile 新服务层
 * 使用 Repository 模式实现数据访问
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const _ = require('lodash');

class UploadFileService extends Service {
  /**
   * 获取 uploadFile repository
   */
  get uploadFileRepository() {
    if (!this._uploadFileRepository) {
      const factory = new RepositoryFactory(this.app);
      this._uploadFileRepository = factory.createUploadFileRepository(this.ctx);
    }
    return this._uploadFileRepository;
  }

  /**
   * 查找上传文件配置
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   */
  async find(payload, options = {}) {
    return await this.uploadFileRepository.find(payload, options);
  }

  /**
   * 查找单个上传文件配置
   * @param {Object} params 查询参数
   */
  async findOne(params = {}) {
    return await this.uploadFileRepository.findOne(params);
  }

  /**
   * 根据ID查找上传文件配置
   * @param {String} id 配置ID
   * @param {Object} options 查询选项
   */
  async findById(id, options = {}) {
    return await this.uploadFileRepository.findById(id, options);
  }

  /**
   * 统计上传文件配置数量
   * @param {Object} query 查询条件
   */
  async count(query = {}) {
    return await this.uploadFileRepository.count(query);
  }

  /**
   * 创建上传文件配置
   * @param {Object} data 配置数据
   */
  async create(data) {
    return await this.uploadFileRepository.create(data);
  }

  /**
   * 更新上传文件配置
   * @param {String} id 配置ID
   * @param {Object} data 更新数据
   */
  async update(id, data) {
    return await this.uploadFileRepository.update(id, data);
  }

  /**
   * 删除上传文件配置
   * @param {String|Array} ids 配置ID或ID数组
   * @param {String} key 主键字段名
   */
  async remove(ids, key = 'id') {
    return await this.uploadFileRepository.remove(ids, key);
  }

  /**
   * 软删除上传文件配置
   * @param {String|Array} ids 配置ID或ID数组
   * @param {Object} updateObj 更新对象
   */
  async safeDelete(ids, updateObj = {}) {
    return await this.uploadFileRepository.safeDelete(ids, updateObj);
  }

  /**
   * 批量更新上传文件配置
   * @param {String|Array} ids 配置ID或ID数组
   * @param {Object} data 更新数据
   * @param {Object} query 额外查询条件
   */
  async updateMany(ids, data, query = {}) {
    return await this.uploadFileRepository.updateMany(ids, data, query);
  }

  /**
   * 根据上传类型查找配置
   * @param {String} type 上传类型
   * @param {Object} options 查询选项
   */
  async findByType(type, options = {}) {
    return await this.uploadFileRepository.findByType(type, options);
  }

  /**
   * 获取默认上传配置
   * @param {Object} options 查询选项
   */
  async getDefaultConfig(options = {}) {
    return await this.uploadFileRepository.getDefaultConfig(options);
  }

  /**
   * 创建或更新上传配置
   * @param {Object} configData 配置数据
   */
  async createOrUpdateConfig(configData) {
    return await this.uploadFileRepository.createOrUpdateConfig(configData);
  }

  /**
   * 验证上传配置的有效性
   * @param {String} type 上传类型
   * @param {Object} config 配置对象
   * @return {Promise<Boolean>} 是否有效
   */
  async validateConfig(type, config) {
    return await this.uploadFileRepository.validateConfig(type, config);
  }

  /**
   * 检查上传类型是否唯一
   * @param {String} type 上传类型
   * @param {String} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkTypeUnique(type, excludeId = null) {
    return await this.uploadFileRepository.checkTypeUnique(type, excludeId);
  }

  /**
   * 获取七牛云配置
   * @param {Object} options 查询选项
   */
  async getQiniuConfig(options = {}) {
    return await this.uploadFileRepository.getQiniuConfig(options);
  }

  /**
   * 获取阿里云OSS配置
   * @param {Object} options 查询选项
   */
  async getOssConfig(options = {}) {
    return await this.uploadFileRepository.getOssConfig(options);
  }

  /**
   * 获取本地存储配置
   * @param {Object} options 查询选项
   */
  async getLocalConfig(options = {}) {
    return await this.uploadFileRepository.getLocalConfig(options);
  }

  /**
   * 更新上传配置
   * @param {String} id 配置ID
   * @param {Object} configData 配置数据
   */
  async updateUploadConfig(id, configData) {
    return await this.uploadFileRepository.updateUploadConfig(id, configData);
  }

  /**
   * 检查配置是否存在
   * @param {String} type 上传类型
   */
  async configExists(type) {
    return await this.uploadFileRepository.configExists(type);
  }

  /**
   * 获取所有上传配置
   * @param {Object} options 查询选项
   */
  async getAllConfigs(options = {}) {
    return await this.uploadFileRepository.getAllConfigs(options);
  }

  /**
   * 删除上传配置
   * @param {String} id 配置ID
   */
  async deleteConfig(id) {
    return await this.uploadFileRepository.deleteConfig(id);
  }

  /**
   * 批量删除上传配置
   * @param {Array} ids 配置ID数组
   */
  async deleteConfigs(ids) {
    return await this.uploadFileRepository.deleteConfigs(ids);
  }

  /**
   * 获取上传配置信息（兼容旧接口）
   * @param {Object} payload 查询参数
   */
  async getUploadConfig(payload = {}) {
    const queryObj = {};
    const uploadFileList = await this.find({ isPaging: '0', ...payload }, { query: queryObj });

    if (_.isEmpty(uploadFileList)) {
      // 如果没有配置，创建一个默认的本地配置
      const configInfo = await this.create({
        type: 'local',
        uploadPath: process.cwd() + '/app/public',
      });
      return [configInfo];
    }

    return Array.isArray(uploadFileList) ? uploadFileList : [uploadFileList];
  }

  /**
   * 更新上传配置（兼容旧接口）
   * @param {String} id 配置ID
   * @param {Object} fields 更新字段
   */
  async updateUploadFileConfig(id, fields) {
    const formObj = {
      type: fields.type,
      updatedAt: new Date(),
    };

    // 根据类型添加相应字段
    if (fields.type === 'local') {
      Object.assign(formObj, {
        uploadPath: fields.uploadPath,
      });
    } else if (fields.type === 'qn') {
      Object.assign(formObj, {
        qn_bucket: fields.qn_bucket,
        qn_accessKey: fields.qn_accessKey,
        qn_secretKey: fields.qn_secretKey,
        qn_zone: fields.qn_zone,
        qn_endPoint: fields.qn_endPoint,
      });
    } else if (fields.type === 'oss') {
      Object.assign(formObj, {
        oss_bucket: fields.oss_bucket,
        oss_accessKey: fields.oss_accessKey,
        oss_secretKey: fields.oss_secretKey,
        oss_region: fields.oss_region,
        oss_endPoint: fields.oss_endPoint,
        oss_apiVersion: fields.oss_apiVersion,
      });
    }

    return await this.update(id, formObj);
  }

  /**
   * 获取 Repository 统计信息（调试用）
   * @return {Object} 统计信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }
}

module.exports = UploadFileService;
