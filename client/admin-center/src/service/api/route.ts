import { request } from '../request';

/** get constant routes */
export function fetchGetConstantRoutes() {
  return request<Api.Route.MenuRoute[]>({
    url: '/manage/v1/admins/me/routes',
    method: 'get',
    params: { hideInMenu: '1' }
  });
}

/** get user routes */
export function fetchGetUserRoutes() {
  return request<Api.Route.UserRoute>({
    url: '/manage/v1/admins/me/routes',
    method: 'get',
    params: { hideInMenu: '0' }
  });
}

/**
 * whether the route is exist
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string) {
  return request<boolean>({ url: '/route/isRouteExist', params: { routeName } });
}
