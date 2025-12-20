import { request } from '../request';

/** Get system option log list */
export function fetchSystemOptionLogList(params: Api.SystemManage.SystemOptionLogSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.SystemManage.SystemOptionLog>>({
    url: '/manage/systemOptionLog/getList',
    method: 'get',
    params
  });
}

/** Delete system option log */
export function deleteSystemOptionLog(ids: string) {
  return request({
    url: '/manage/systemOptionLog/deleteLogItem',
    method: 'post',
    data: { ids }
  });
}

/** Delete all system option logs */
export function deleteAllSystemOptionLogs() {
  return request({
    url: '/manage/systemOptionLog/deleteAllLogItem',
    method: 'post'
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
    url: '/manage/systemOptionLog/getStatistics',
    method: 'get'
  });
}

/** Export logs */
export function exportLogs(params: Api.SystemManage.SystemOptionLogSearchParams) {
  return request({
    url: '/manage/systemOptionLog/exportLogs',
    method: 'get',
    params,
    responseType: 'blob'
  });
}
