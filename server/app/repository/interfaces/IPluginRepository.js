/**
 * Plugin Repository 接口定义
 * 定义插件相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IPluginRepository extends IBaseRepository {
  /**
   * 根据状态查找插件
   * @param {Boolean} state
   * @param _state
   * @return {Promise<Array>}
   */
  async findByState(_state) {
    throw new Error('Method findByState() must be implemented');
  }

  /**
   * 根据安装者查找插件
   * @param {String} adminId
   * @param _adminId
   * @return {Promise<Array>}
   */
  async findByInstallor(_adminId) {
    throw new Error('Method findByInstallor() must be implemented');
  }

  /**
   * 根据类型查找插件
   * @param {String} type
   * @param _type
   * @return {Promise<Array>}
   */
  async findByType(_type) {
    throw new Error('Method findByType() must be implemented');
  }
}

module.exports = IPluginRepository;
