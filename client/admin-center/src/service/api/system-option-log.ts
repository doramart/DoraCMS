import { request } from '../request';

/** Get system option log list */
export function fetchSystemOptionLogList(params: Api.SystemManage.SystemOptionLogSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.SystemManage.SystemOptionLog>>({
    url: '/manage/v1/logs',
    method: 'get',
    params
  });
}

/** Delete system option log */
export function deleteSystemOptionLog(ids: string) {
  return request({
    url: `/manage/v1/logs/${ids}`,
    method: 'delete'
  });
}

/** Delete all system option logs */
export function deleteAllSystemOptionLogs() {
  return request({
    url: '/manage/v1/logs/all',
    method: 'delete'
  });
}

/** Get log statistics */
export function fetchLogStatistics() {
  return request<{
    total: number;
    today: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byModule: Record<string, number>;
  }>({
    url: '/manage/v1/logs/stats',  // 🔥 使用 RESTful 路由
    method: 'get'
  });
}

/** Export logs */
export function exportLogs(params: Api.SystemManage.SystemOptionLogSearchParams) {
  return request({
    url: '/manage/v1/logs/export',  // 🔥 使用 RESTful 路由
    method: 'get',
    params,
    responseType: 'blob'
  });
}
