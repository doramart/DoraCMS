import { useAuthStore } from '@/store/modules/auth';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/store/modules/auth/shared';
import { localStg } from '@/utils/storage';
import { fetchRefreshToken } from '../api';
import type { RequestInstanceState } from './type';

export function getAuthorization() {
  // const token = localStg.get(TOKEN_KEY);
  // const Authorization = token ? `Bearer ${token}` : null;
  const { token } = useAuthStore();
  return `Bearer ${token}`;
}

/** refresh token */
async function handleRefreshToken() {
  const { resetStore } = useAuthStore();

  const rToken = localStg.get(REFRESH_TOKEN_KEY) || '';
  const { error, data } = await fetchRefreshToken(rToken);
  if (!error) {
    localStg.set(TOKEN_KEY, data.token);
    localStg.set(REFRESH_TOKEN_KEY, data.refreshToken);
    return true;
  }

  resetStore();

  return false;
}

export async function handleExpiredRequest(state: RequestInstanceState) {
  if (!state.refreshTokenFn) {
    state.refreshTokenFn = handleRefreshToken();
  }

  const success = await state.refreshTokenFn;

  setTimeout(() => {
    state.refreshTokenFn = null;
  }, 1000);

  return success;
}

export function showErrorMsg(state: RequestInstanceState, message: string) {
  if (!state.errMsgStack?.length) {
    state.errMsgStack = [];
  }

  const isExist = state.errMsgStack.includes(message);

  if (!isExist) {
    state.errMsgStack.push(message);

    window.$message?.error({
      message,
      onClose: () => {
        state.errMsgStack = state.errMsgStack.filter(msg => msg !== message);

        setTimeout(() => {
          state.errMsgStack = [];
        }, 5000);
      }
    });
  }
}
