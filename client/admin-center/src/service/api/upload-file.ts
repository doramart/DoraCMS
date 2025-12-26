import { request } from '../request';
import { standardDelete } from './deleteHelper';
/** Get upload configuration list */
export function fetchGetUploadConfig() {
  return request<Api.SystemManage.UploadConfig>({
    url: '/manage/v1/files',
    method: 'get'
  });
}

/** Update upload configuration */
export function updateUploadConfig(data: Api.SystemManage.UploadConfig) {
  return request<Api.SystemManage.UploadConfig>({
    url: `/manage/v1/files/${data.id}`,
    method: 'put',
    data
  });
}

/** Delete upload file */
export function deleteUploadFile(ids: string | string[]) {
  return standardDelete<Api.SystemManage.UploadConfig>('v1/files', ids);
}
