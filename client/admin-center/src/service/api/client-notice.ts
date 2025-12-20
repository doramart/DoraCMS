import { request } from '../request';

/** 获取客户端公告列表 */
export function fetchClientNoticeList(params?: Api.Notice.ClientNoticeSearchParams) {
  return request<Api.Common.ListResponse<Api.Notice.ClientNotice>>({
    url: '/manage/singleUser/getClientNotice',
    method: 'get',
    params
  });
}

