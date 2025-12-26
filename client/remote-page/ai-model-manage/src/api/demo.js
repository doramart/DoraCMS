import { get, post } from '@/utils/request';

/**
 * 获取演示数据
 * @returns {Promise}
 */
export function getDemoData() {
  // 模拟 API 调用
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        status: 200,
        data: {
          timestamp: new Date().toLocaleString(),
          status: 'success',
          message: 'This is a demo response from mock API',
          data: {
            id: Math.floor(Math.random() * 1000),
            value: Math.random().toFixed(2),
          },
        },
      });
    }, 1000);
  });
}

/**
 * 获取用户列表（示例）
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getUserList(params) {
  return get('/api/users', params);
}

/**
 * 创建用户（示例）
 * @param {Object} data - 用户数据
 * @returns {Promise}
 */
export function createUser(data) {
  return post('/api/users', data);
}

/**
 * 更新用户（示例）
 * @param {string} id - 用户ID
 * @param {Object} data - 用户数据
 * @returns {Promise}
 */
export function updateUser(id, data) {
  return post(`/api/v1/users/${id}`, data);  // 🔥 使用 RESTful v1 路由
}
