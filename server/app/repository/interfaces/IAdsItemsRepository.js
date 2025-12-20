/**
 * AdsItems Repository 接口定义
 * 定义广告单元相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IAdsItemsRepository extends IBaseRepository {
  /**
   * 根据标题查找广告单元
   * @param {String} title
   * @param _title
   * @return {Promise<Array>}
   */
  async findByTitle(_title) {
    throw new Error('Method findByTitle() must be implemented');
  }

  /**
   * 根据链接查找广告单元
   * @param {String} link
   * @param _link
   * @return {Promise<Array>}
   */
  async findByLink(_link) {
    throw new Error('Method findByLink() must be implemented');
  }

  /**
   * 根据状态查找广告单元（如是否启用、target等）
   * @param {String} target
   * @param _target
   * @return {Promise<Array>}
   */
  async findByTarget(_target) {
    throw new Error('Method findByTarget() must be implemented');
  }
}

module.exports = IAdsItemsRepository;
