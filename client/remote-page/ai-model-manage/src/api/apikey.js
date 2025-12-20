import request from '@/utils/request';

// API Key 管理接口
export const apiKeyApi = {
  // 获取 API Key 列表
  list: params => {
    return request({
      url: '/api/user/api-key/list',
      method: 'get',
      params,
    });
  },

  // 创建 API Key
  create: data => {
    return request({
      url: '/api/user/api-key/create',
      method: 'post',
      data,
    });
  },

  // 更新 API Key
  update: (id, data) => {
    return request({
      url: `/api/user/api-key/update/${id}`,
      method: 'put',
      data,
    });
  },

  // 删除 API Key
  delete: id => {
    return request({
      url: `/api/user/api-key/delete`,
      method: 'post',
      data: { id },
    });
  },

  // 获取 API Key 详情
  detail: id => {
    return request({
      url: `/api/user/api-key/detail/${id}`,
      method: 'get',
    });
  },

  // 禁用 API Key
  disable: id => {
    return request({
      url: `/api/user/api-key/disable/${id}`,
      method: 'put',
    });
  },

  // 启用 API Key
  enable: id => {
    return request({
      url: `/api/user/api-key/enable/${id}`,
      method: 'put',
    });
  },

  // 轮换 API Key
  rotate: id => {
    return request({
      url: `/api/user/api-key/rotate/${id}`,
      method: 'put',
    });
  },
};
