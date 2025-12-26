import { get, post, put, del } from '@/utils/request';

// 获取用户通知列表
export function getUserNotices(params) {
  return get('/api/v1/notifications', { params });  // 🔥 使用 RESTful v1 路由
}

// 设置通知已读
export function setNoticeRead(ids) {
  return put(`/api/v1/notifications/${ids}/read`);  // 🔥 使用 RESTful v1 路由 + PUT 方法
}

// 删除通知
export function deleteNotice(id) {
  return del(`/api/v1/notifications/${id}`);  // 🔥 使用 RESTful v1 路由 + DELETE 方法
}
