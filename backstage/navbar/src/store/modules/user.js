import { getRoleResources, logout, getInfo } from '@/api/user';
import { getToken, setToken, removeToken } from '@root/publicMethods/auth';
import { constantRoutes, resetRouter } from '@/router';
import { isEmpty, uniq, filter } from 'lodash';
const state = {
  token: getToken(),
  routes: [],
  name: '',
  avatar: '',
  showSideBar: false,
  tabs: [],
  activeTab: {},
};

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes;
    state.routes = constantRoutes.concat(routes);
  },
  SET_TOKEN: (state, token) => {
    state.token = token;
  },
  SET_NAME: (state, name) => {
    state.name = name;
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar;
  },
  SET_SIDEBAR: (state, show) => {
    state.showSideBar = show;
  },
  SET_TBS: (state, payload) => {
    state.tabs = payload;
  },
  SET_ACTIVE_TAB: (state, payload) => {
    state.activeTab = payload;
  },
};

const actions = {
  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo(state.token)
        .then((response) => {
          const { data } = response;

          if (!data) {
            reject('Verification failed, please Login again.');
          }

          const { userName, logo } = data.userInfo;

          commit('SET_NAME', userName);
          commit('SET_AVATAR', logo);
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      logout(state.token)
        .then(() => {
          commit('SET_TOKEN', '');
          commit('SET_ROUTES', '');
          removeToken('1');
          resetRouter();
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getResources({ commit, state }) {
    return new Promise((resolve, reject) => {
      getRoleResources(state.token)
        .then((response) => {
          const { data } = response;

          if (!data) {
            reject('Verification failed, please Login again.');
          }

          commit('SET_ROUTES', data);
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  showSideBar({ commit }) {
    let showSideBarState = getToken() ? true : false;
    commit('SET_SIDEBAR', showSideBarState);
  },

  // remove token
  resetToken({ commit }) {
    return new Promise((resolve) => {
      commit('SET_TOKEN', '');
      removeToken();
      resolve();
    });
  },

  // 记录tabs
  setTabs({ commit, state }, payload) {
    let targetRoute = {};
    const { to, action } = payload;
    const searchRouteInfo = (routePath, routes) => {
      for (const element of routes) {
        if (routePath == element.path || routePath == element.redirect) {
          targetRoute = element;
          break;
        } else {
          if (
            isEmpty(targetRoute) &&
            element.children &&
            element.children.length > 0
          ) {
            searchRouteInfo(routePath, element.children);
          }
        }
      }
      return targetRoute;
    };
    let routeItem = searchRouteInfo(to.path, state.routes);
    if (!isEmpty(routeItem)) {
      let thisTabs = [].concat(state.tabs);
      if (action == 'add') {
        const oldTabs = filter(thisTabs, (item) => {
          return item.path == routeItem.path;
        });
        if (oldTabs.length) {
            commit('SET_ACTIVE_TAB', JSON.parse(JSON.stringify(routeItem)));
          return;
        }
        thisTabs.push(routeItem);
      } else if (action == 'remove') {
        thisTabs = filter(thisTabs, (item) => {
          return item.path != routeItem.path;
        });
      }
      thisTabs = uniq(thisTabs);
      commit('SET_TBS', thisTabs);
    }
  },
  // 设置当前激活的tab
  setActiveTab({ commit }, payload) {
    if (!isEmpty(payload)) {
      commit('SET_ACTIVE_TAB', payload);
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
