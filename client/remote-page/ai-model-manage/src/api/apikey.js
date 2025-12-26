import request from '@/utils/request';

// API Key 管理接口 (RESTful v1)
export const apiKeyApi = {
  // 获取 API Key 列表
  list: params => {
    return request({
      url: '/api/v1/user/api-keys',
      method: 'get',
      params,
    });
  },

  // 创建 API Key
  create: data => {
    return request({
      url: '/api/v1/user/api-keys',
      method: 'post',
      data,
    });
  },

  // 获取 API Key 详情
  detail: id => {
    return request({
      url: `/api/v1/user/api-keys/${id}`,
      method: 'get',
    });
  },

  // 更新 API Key
  update: (id, data) => {
    return request({
      url: `/api/v1/user/api-keys/${id}`,
      method: 'put',
      data,
    });
  },

  // 删除 API Key
  delete: id => {
    return request({
      url: `/api/v1/user/api-keys/${id}`,
      method: 'delete',
    });
  },

  // 启用 API Key
  enable: id => {
    return request({
      url: `/api/v1/user/api-keys/${id}/enable`,
      method: 'put',
    });
  },

  // 禁用 API Key
  disable: id => {
    return request({
      url: `/api/v1/user/api-keys/${id}/disable`,
      method: 'put',
    });
  },

  // 轮换 API Key
  rotate: id => {
    return request({
      url: `/api/v1/user/api-keys/${id}/rotate`,
      method: 'post',
    });
  },
};
