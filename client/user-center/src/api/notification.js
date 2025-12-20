import { get, post, put } from '@/utils/request';

// 获取用户通知列表
export function getUserNotices(params) {
  return get('/api/singleUser/getClientNotice', { params });
}

// // 设置通知已读
// export function setNoticeRead(ids) {
//   return get(`/api/systemNotify/setNoticeRead?ids=${ids}`);
// }

// // 删除通知
// export function deleteNotice(id) {
//   return get(`/api/systemNotify/delUserNotify?ids=${id}`);
// }
