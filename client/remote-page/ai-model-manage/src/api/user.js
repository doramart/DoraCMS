import { get, post, put, del } from '@/utils/request';

// ==================== 用户认证 ====================
// 用户登录
export function login(data) {
  return post('/api/v1/auth/login', data);
}

// 用户注销
export function logout() {
  return post('/api/v1/auth/logout');
}

// 用户注册
export function register(data) {
  return post('/api/v1/auth/register', data);
}

// 发送确认邮件
export function sendConfirmEmail(data) {
  return post('/api/v1/users/me/confirm-email', data);
}

// 重置密码（通过邮件链接）
export function resetPassword(data) {
  return post('/api/v1/auth/reset-password', data);
}

// ==================== 用户信息 ====================
// 获取用户信息
export function getUserInfo() {
  return get('/api/v1/users/me');
}

// 获取用户评论列表
export function getUserComments(params) {
  return get('/api/v1/messages', params);
}

// 删除评论
export function deleteComment(id) {
  return del(`/api/v1/messages/${id}`);
}

// 获取用户通知列表
export function getUserNotices(params) {
  return get('/api/v1/users/me/notices', { params });
}

// 更新通知状态
export function updateNoticeState(data) {
  return put('/api/v1/users/me/notices/state', data);
}
