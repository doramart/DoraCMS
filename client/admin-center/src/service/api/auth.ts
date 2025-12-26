import { request } from '../request';

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(userName: string, password: string, imageCode?: string) {
  return request({
    url: '/api/v1/admin/login',
    method: 'post',
    data: {
      userName,
      password,
      imageCode,
    },
  });
}

/** 获取管理员初始化状态 */
export function fetchAdminInitStatus() {
  return request<Api.Auth.InitStatus>({
    url: '/api/v1/admin/init/status',
    method: 'get',
  });
}

/** 初始化超级管理员 */
export function fetchInitSuperAdmin(data: Api.Auth.InitAdminParams) {
  return request({
    url: '/api/v1/admin/init',
    method: 'post',
    data,
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request({ url: '/manage/v1/admins/me' });
}

/** Get user logout */
export function userLogout() {
  return request({ url: '/manage/v1/admins/logout', method: 'post' });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refreshToken',
    method: 'post',
    data: {
      refreshToken,
    },
  });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}
