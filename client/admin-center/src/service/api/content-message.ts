import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** get content message list */
export function fetchGetContentMessageList(params?: Api.DocumentManage.ContentMessageSearchParams) {
  return request<Api.DocumentManage.ContentMessageList>({
    url: '/manage/contentMessage/getList',
    method: 'get',
    params
  });
}

/** get one content message */
export function fetchGetOneContentMessage(id: string) {
  return request<Api.DocumentManage.ContentMessage>({
    url: `/manage/contentMessage/getOne?id=${id}`,
    method: 'get'
  });
}

/** add content message (reply) */
export function addContentMessage(params: Api.DocumentManage.ContentMessageReply) {
  return request<Api.DocumentManage.ContentMessage>({
    url: '/manage/contentMessage/addOne',
    method: 'post',
    data: { ...params }
  });
}

/** delete content message */
export function deleteContentMessage(ids: string | string[]) {
  return standardDelete('contentMessage', ids);
}

/** get content message statistics */
export function fetchContentMessageStats(params?: {
  contentId?: string;
  author?: string;
  adminAuthor?: string;
}) {
  return request<Api.DocumentManage.ContentMessageStats>({
    url: '/manage/contentMessage/getStats',
    method: 'get',
    params
  });
}
