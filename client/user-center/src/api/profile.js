import { get, post, put } from '@/utils/request';

// 获取用户详细信息
export function getUserProfile() {
  return get(`/api/user/userInfo`);
}

// 更新用户信息
export function updateUserProfile(data) {
  return post('/api/user/updateInfo', data);
}

// 修改密码
export function changePassword(data) {
  return post('/api/user/updateInfo', data);
}

// 发送验证码
export function sendVerificationCode(data) {
  return post('/api/user/sendVerificationCode', data);
}

// 重置密码
export function resetPassword(data) {
  return post('/api/user/resetPassword', data);
}
