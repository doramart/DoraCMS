import request from '@/utils/request';

// ==================== 内容管理 ====================
/**
 * Get user content list
 * @param {Object} params - Query parameters
 */
export function getUserContents(params) {
  return request({
    url: '/api/v1/users/me/contents',
    method: 'get',
    params,
  });
}

/**
 * Get content by ID
 * @param {String} id - Content ID
 */
export function getContentById(id) {
  return request({
    url: `/api/v1/content/${id}`,
    method: 'get',
  });
}

/**
 * Add new content
 * @param {Object} data - Content data
 */
export function addContent(data) {
  return request({
    url: '/api/v1/content',
    method: 'post',
    data,
  });
}

/**
 * Update content
 * @param {Object} data - Content data with id
 */
export function updateContent(data) {
  return request({
    url: `/api/v1/content/${data.id}`,
    method: 'put',
    data,
  });
}

/**
 * Delete content
 * @param {String} id - Content ID
 */
export function deleteContent(id) {
  return request({
    url: `/api/v1/content/${id}`,
    method: 'delete',
  });
}

// ==================== 分类管理 ====================
/**
 * Get categories
 * @param {Object} params - Query parameters
 */
export function getCategories(params) {
  return request({
    url: '/api/v1/categories',
    method: 'get',
    params,
  });
}

// ==================== 标签管理 ====================
/**
 * Get tags
 * @param {Object} params - Query parameters
 */
export function getTags(params) {
  return request({
    url: '/api/v1/tags',
    method: 'get',
    params,
  });
}

// ==================== 留言评论 ====================
/**
 * Get user messages/comments
 * @param {Object} params - Query parameters
 */
export function getUserComments(params) {
  return request({
    url: '/api/v1/messages',
    method: 'get',
    params,
  });
}

/**
 * Delete message/comment
 * @param {String} id - Message ID
 */
export function deleteComment(id) {
  return request({
    url: `/api/v1/messages/${id}`,
    method: 'delete',
  });
}
