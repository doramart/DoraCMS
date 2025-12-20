import { getToken as getAuthToken } from '@/store/modules/auth/shared';
import { sessionStg } from '@/utils/storage';

/**
 * Get token from storage
 *
 * @param type - '1' for special case, undefined for regular case
 * @returns token string
 */
export function getToken(type?: string): string {
  // For special type (compatible with old code)
  if (type === '1') {
    return sessionStg.get('token') || '';
  }

  // Default: use the existing getToken from auth module
  return getAuthToken();
}
