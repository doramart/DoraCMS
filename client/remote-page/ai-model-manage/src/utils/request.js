import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000 * 3,
});

// 允许携带后台登录 cookie（用于跨源或端口时）
request.defaults.withCredentials = true;

// 是否正在刷新token
let isRefreshing = false;
// 重试队列
let retryRequests = [];

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 优先使用后台管理 token（可通过环境变量配置 key）
    const tokenKey = import.meta.env.VITE_ADMIN_TOKEN_KEY || 'doracms_admin_token';
    const token = localStorage.getItem(tokenKey);
    if (token) {
      // 检查token是否过期
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000;

      if (Date.now() >= expirationTime) {
        // token已过期，尝试刷新
        if (!isRefreshing) {
          isRefreshing = true;
          // 这里可以调用刷新token的接口
          // return refreshToken().then(newToken => {
          //   localStorage.setItem('token', newToken)
          //   config.headers.Authorization = newToken  // 直接使用token，不加Bearer前缀
          //   retryRequests.forEach(cb => cb(newToken))
          //   retryRequests = []
          //   return config
          // }).catch(err => {
          //   localStorage.removeItem('token')
          //   router.push('/login')
          //   return Promise.reject(err)
          // }).finally(() => {
          //   isRefreshing = false
          // })
        } else {
          // 将请求加入重试队列
          return new Promise(resolve => {
            retryRequests.push(token => {
              config.headers.Authorization = `Bearer ${token}`; // 直接使用token，不加Bearer前缀
              resolve(config);
            });
          });
        }
      }

      config.headers.Authorization = `Bearer ${token}`; // 直接使用token，不加Bearer前缀
    }
    // 需要在跨端口场景下也携带 cookie（authAdminToken 可用）
    config.withCredentials = true;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.status !== 0 && res.status !== 200) {
      ElMessage.error(res.message || '服务器返回错误');

      if (res.status === 401) {
        // token失效，清除token并跳转到登录页
        localStorage.removeItem(tokenKey);
        // TODO 临时注释，待测试
        // router.push('/login');
      }

      return Promise.reject(new Error(res.message || '服务器返回错误'));
    } else {
      return res;
    }
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // token失效，清除token并跳转到登录页
          localStorage.removeItem('token');
          // TODO 临时注释，待测试
          // router.push('/login');
          break;
        case 403:
          ElMessage.error('没有权限访问该资源');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error(error.response?.data?.message || '服务器内部错误');
          break;
        default:
          ElMessage.error('网络错误，请稍后重试');
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络设置');
    }
    return Promise.reject(error);
  }
);

// 封装 GET 请求
export function get(url, params = {}) {
  return request({
    url,
    method: 'get',
    params,
  });
}

// 封装 POST 请求
export function post(url, data = {}) {
  return request({
    url,
    method: 'post',
    data,
  });
}

// 封装 PUT 请求
export function put(url, data = {}) {
  return request({
    url,
    method: 'put',
    data,
  });
}

// 封装 DELETE 请求
export function del(url, data = {}) {
  return request({
    url,
    method: 'delete',
    data,
  });
}

export default request;
