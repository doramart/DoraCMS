import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get advertisement list */
export function getAdList(params: any) {
  return request({
    url: '/manage/ads/getList',
    method: 'get',
    params
  });
}

/** Get advertisement detail */
export function getAdDetail(id: string) {
  return request<Api.DocumentManage.Advertisement>({
    url: '/manage/ads/getOne',
    method: 'get',
    params: { id: id }
  });
}

/** Create advertisement */
export function createAd(data: Partial<Api.DocumentManage.Advertisement>) {
  return request<Api.DocumentManage.Advertisement>({
    url: '/manage/ads/addOne',
    method: 'post',
    data
  });
}

/** Update advertisement */
export function updateAd(data: Partial<Api.DocumentManage.Advertisement>) {
  return request<Record<string, never>>({
    url: '/manage/ads/updateOne',
    method: 'post',
    data
  });
}

/** Delete advertisement */
export function deleteAd(ids: string | string[]) {
  return standardDelete<Record<string, never>>('ads', ids);
}
