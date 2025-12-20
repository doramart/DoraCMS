/**
 * Ads Repository 接口定义
 * 定义广告相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IAdsRepository extends IBaseRepository {
  /**
   * 根据状态查找广告
   * @param {Boolean} state
   * @param _state
   * @return {Promise<Array>}
   */
  async findByState(_state) {
    throw new Error('Method findByState() must be implemented');
  }

  /**
   * 根据类型查找广告
   * @param {String} type
   * @param _type
   * @return {Promise<Array>}
   */
  async findByType(_type) {
    throw new Error('Method findByType() must be implemented');
  }

  /**
   * 根据 items（广告单元）查找广告
   * @param {String|Array} itemsId
   * @param _itemsId
   * @return {Promise<Array>}
   */
  async findByItems(_itemsId) {
    throw new Error('Method findByItems() must be implemented');
  }
}

module.exports = IAdsRepository;
