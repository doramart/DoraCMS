import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get mail template list */
export function fetchGetMailTemplateList(params?: Api.Email.MailTemplateSearchParams) {
  return request<Api.Email.MailTemplateList>({
    url: '/manage/v1/mail-templates',
    method: 'get',
    params
  });
}

/** Get mail template type list */
export function fetchGetMailTemplateTypeList() {
  return request<Record<string, string>>({
    url: '/manage/v1/mail-templates/types',
    method: 'get'
  });
}

/** Get one mail template */
export function fetchGetOneMailTemplate(id: string) {
  return request<Api.Email.MailTemplate>({
    url: `/manage/v1/mail-templates/${id}`,
    method: 'get'
  });
}

/** Update mail template */
export function updateMailTemplate(params: Api.Email.MailTemplate) {
  return request<Api.Email.MailTemplate>({
    url: `/manage/v1/mail-templates/${params.id}`,
    method: 'put',
    data: { ...params }
  });
}

/** Create mail template */
export function createMailTemplate(params: Api.Email.MailTemplate) {
  return request<Api.Email.MailTemplate>({
    url: '/manage/v1/mail-templates',
    method: 'post',
    data: { ...params }
  });
}

/** Delete mail template */
export function deleteMailTemplate(ids: string | string[]) {
  return standardDelete<Api.Email.MailTemplateList>('v1/mail-templates', ids);
}
