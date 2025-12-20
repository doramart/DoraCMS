import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getUserInfo, login, logout } from '@/api/user';

const TOKEN_KEY = 'doracms_user_token';

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem(TOKEN_KEY) || '');
  const userInfo = ref({});
  const isLoggedIn = computed(() => !!token.value);

  // 获取用户信息
  async function fetchUserInfo() {
    try {
      const res = await getUserInfo();
      userInfo.value = res.data;
      return res.data;
    } catch (error) {
      console.error('获取用户信息失败', error);
      return null;
    }
  }

  // 登录
  async function userLogin(userForm) {
    try {
      const res = await login(userForm);
      token.value = res.data.token;
      localStorage.setItem(TOKEN_KEY, res.data.token);
      await fetchUserInfo();
      return true;
    } catch (error) {
      console.error('登录失败', error);
      return false;
    }
  }

  // 登出
  async function userLogout() {
    try {
      await logout();
      resetUserState();
      return true;
    } catch (error) {
      console.error('登出失败', error);
      resetUserState(); // 即使API调用失败也清除本地状态
      return false;
    }
  }

  // 重置用户状态
  function resetUserState() {
    token.value = '';
    userInfo.value = {};
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    fetchUserInfo,
    userLogin,
    userLogout,
    resetUserState,
  };
});
