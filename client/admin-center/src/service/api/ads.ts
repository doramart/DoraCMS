import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get advertisement list */
export function getAdList(params: any) {
  return request({
    url: '/manage/v1/ads',
    method: 'get',
    params
  });
}

/** Get advertisement detail */
export function getAdDetail(id: string) {
  return request<Api.DocumentManage.Advertisement>({
    url: `/manage/v1/ads/${id}`,
    method: 'get'
  });
}

/** Create advertisement */
export function createAd(data: Partial<Api.DocumentManage.Advertisement>) {
  return request<Api.DocumentManage.Advertisement>({
    url: '/manage/v1/ads',
    method: 'post',
    data
  });
}

/** Update advertisement */
export function updateAd(data: Partial<Api.DocumentManage.Advertisement>) {
  return request<Record<string, never>>({
    url: `/manage/v1/ads/${data.id}`,
    method: 'put',
    data
  });
}

/** Delete advertisement */
export function deleteAd(ids: string | string[]) {
  return standardDelete<Record<string, never>>('v1/ads', ids);
}
