import { request } from '../request';

/** 获取缓存监控统计 */
export function fetchCacheStats() {
  return request<Api.Ops.CacheStats>({
    url: '/manage/cache/stats',
    method: 'get'
  });
}

/** 获取 Sitemap 状态 */
export function fetchSitemapStatus() {
  return request<Api.Ops.SitemapStatus>({
    url: '/manage/sitemap/status',
    method: 'get'
  });
}
