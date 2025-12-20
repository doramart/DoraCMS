/**
 * Message Repository 接口定义
 * 定义留言相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IMessageRepository extends IBaseRepository {
  /**
   * 根据内容ID查找留言
   * @param {String} contentId 内容ID
   * @param {Object} options 查询选项 { files, populate }
   * @param _options
   * @return {Promise<Array>} 留言列表
   */
  async findByContentId(contentId, _options = {}) {
    throw new Error('Method findByContentId() must be implemented');
  }

  /**
   * 根据作者ID查找留言
   * @param {String} authorId 用户ID
   * @param {Object} options 查询选项 { files, populate }
   * @param _options
   * @return {Promise<Array>} 留言列表
   */
  async findByAuthor(authorId, _options = {}) {
    throw new Error('Method findByAuthor() must be implemented');
  }

  /**
   * 根据父留言ID查找回复
   * @param {String} relationMsgId 父留言ID
   * @param {Object} options 查询选项 { files, populate }
   * @param _options
   * @return {Promise<Array>} 回复列表
   */
  async findReplies(relationMsgId, _options = {}) {
    throw new Error('Method findReplies() must be implemented');
  }

  /**
   * 点赞留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @param _messageId
   * @param _userId
   * @return {Promise<Object>} 更新后的留言
   */
  async praiseMessage(_messageId, _userId) {
    throw new Error('Method praiseMessage() must be implemented');
  }

  /**
   * 取消点赞留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @param _messageId
   * @param _userId
   * @return {Promise<Object>} 更新后的留言
   */
  async unpraiseMessage(_messageId, _userId) {
    throw new Error('Method unpraiseMessage() must be implemented');
  }

  /**
   * 统计留言数量（可按内容、作者、父留言等）
   * @param {Object} query 查询条件
   * @param _query
   * @return {Promise<Number>} 数量
   */
  async count(_query = {}) {
    throw new Error('Method count() must be implemented');
  }
}

module.exports = IMessageRepository;
