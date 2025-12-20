import request from '@/utils/request';

/**
 * Get user content list
 * @param {Object} params - Query parameters
 */
export function getUserContents(params) {
  return request({
    url: '/api/content/getUserContents',
    method: 'get',
    params,
  });
}

/**
 * Get content by ID
 * @param {Object} params - Parameters with id and userId
 */
export function getContentById(params) {
  return request({
    url: '/api/content/getContent',
    method: 'get',
    params,
  });
}

/**
 * Get categories
 * @param {Object} params - Query parameters
 */
export function getCategories(params) {
  return request({
    url: '/api/contentCategory/getList',
    method: 'get',
    params,
  });
}

/**
 * Get tags
 * @param {Object} params - Query parameters
 */
export function getTags(params) {
  return request({
    url: '/api/contentTag/getList',
    method: 'get',
    params,
  });
}

/**
 * Add new content
 * @param {Object} data - Content data
 */
export function addContent(data) {
  return request({
    url: '/api/content/addOne',
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
    url: '/api/content/updateOne',
    method: 'post',
    data,
  });
}

// 删除内容
export function deleteContent(id) {
  return request({
    url: '/api/content/delContent',
    method: 'post',
    data: { id },
  });
}

// 获取用户评论列表
export function getUserComments(params) {
  return request({
    url: '/api/contentMessage/getMessages',
    method: 'get',
    params,
  });
}

// 删除评论
export function deleteComment(id) {
  return request({
    url: '/api/contentMessage/delMessage',
    method: 'post',
    data: { id },
  });
}
