/**
 * MailTemplate Repository 接口定义
 * 定义邮件模板相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IMailTemplateRepository extends IBaseRepository {
  /**
   * 根据标题查找模板
   * @param {String} title
   * @param _title
   * @return {Promise<Object|null>}
   */
  async findByTitle(_title) {
    throw new Error('Method findByTitle() must be implemented');
  }

  /**
   * 根据类型查找模板列表
   * @param {String} type
   * @param _type
   * @return {Promise<Array>}
   */
  async findByType(_type) {
    throw new Error('Method findByType() must be implemented');
  }
}

module.exports = IMailTemplateRepository;
