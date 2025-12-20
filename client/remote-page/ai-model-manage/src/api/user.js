import { get, post, put } from '@/utils/request';

// 用户登录
export function login(data) {
  return post('/api/user/doLogin', data);
}

// 用户注销
export function logout() {
  return get('/api/user/logOut');
}

// 获取用户信息
export function getUserInfo() {
  return get('/api/user/userInfo');
}

// 用户注册
export function register(data) {
  return post('/api/user/doReg', data);
}

// 发送确认邮件
export function sendConfirmEmail(data) {
  return post('/api/user/sentConfirmEmail', data);
}

// 重置密码
export function resetPassword(data) {
  return post('/api/user/updateNewPsd', data);
}

// 获取用户评论列表
export function getUserComments(params) {
  return get('/api/user/getUserComments', params);
}

// 删除评论
export function deleteComment(id) {
  return post('/api/regUser/delComment', { id });
}

// 获取用户通知列表
export function getUserNotices(params) {
  return get('/api/regUser/getUserNotices', { params });
}

// 更新通知状态
export function updateNoticeState(data) {
  return post('/api/regUser/updateNoticeState', data);
}
