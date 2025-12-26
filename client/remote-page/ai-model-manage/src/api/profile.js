import { get, post, put } from '@/utils/request';

// ==================== 用户资料 ====================
// 获取用户详细信息
export function getUserProfile() {
  return get('/api/v1/users/me');
}

// 更新用户信息
export function updateUserProfile(data) {
  return put('/api/v1/users/me', data);
}

// 修改密码
export function changePassword(data) {
  return post('/api/v1/users/me/password', data);
}

// ==================== 验证相关 ====================
// 发送验证码
export function sendVerificationCode(data) {
  return post('/api/v1/auth/send-code', data);
}

// 重置密码（忘记密码场景）
export function resetPassword(data) {
  return post('/api/v1/auth/reset-password', data);
}
