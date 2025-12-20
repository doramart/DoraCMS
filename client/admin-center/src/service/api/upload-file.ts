import { request } from '../request';

/** Get upload configuration list */
export function fetchGetUploadConfig() {
  return request<Api.SystemManage.UploadConfig>({
    url: '/manage/uploadFile/getList',
    method: 'get'
  });
}

/** Update upload configuration */
export function updateUploadConfig(data: Api.SystemManage.UploadConfig) {
  return request<Api.SystemManage.UploadConfig>({
    url: '/manage/uploadFile/updateOne',
    method: 'post',
    data
  });
}
