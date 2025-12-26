import { get, post, put, del } from '@/utils/request';

// ==================== 通知管理 ====================
// 获取用户通知列表
export function getUserNotices(params) {
  return get('/api/singleUser/getClientNotice', { params });
}

// 标记通知为已读
export function setNoticeRead(ids) {
  return put('/api/v1/users/me/notices/read', { ids });
}

// 删除通知
export function deleteNotice(id) {
  return del(`/api/v1/users/me/notices/${id}`);
}

// 批量删除通知
export function deleteNotices(ids) {
  return post('/api/v1/users/me/notices/delete-batch', { ids });
}

// 标记所有通知为已读
export function markAllAsRead() {
  return put('/api/v1/users/me/notices/read-all');
}
