import { localStg } from '@/utils/storage';

/** Token storage key */
export const TOKEN_KEY = 'doracms_admin_token';

/** Refresh token storage key */
export const REFRESH_TOKEN_KEY = 'refreshToken';

/** Get token */
export function getToken() {
  return localStg.get(TOKEN_KEY) || '';
}

/** Clear auth storage */
export function clearAuthStorage() {
  localStg.remove(TOKEN_KEY);
  localStg.remove(REFRESH_TOKEN_KEY);
}
