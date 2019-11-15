import {
  getRoleResources,
  logout,
  getInfo
} from '@/api/user'
import {
  getToken,
  setToken,
  removeToken
} from '@root/publicMethods/auth'
import {
  constantRoutes,
  resetRouter
} from '@/router'

const state = {
  token: getToken(),
  routes: [],
  name: '',
  avatar: '',
  showSideBar: false
}


const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_SIDEBAR: (state, show) => {
    state.showSideBar = show
  }
}

const actions = {

  // get user info
  getInfo({
    commit,
    state
  }) {
    return new Promise((resolve, reject) => {
      getInfo(state.token).then(response => {
        const {
          data
        } = response

        if (!data) {
          reject('Verification failed, please Login again.')
        }

        const {
          userName,
          logo
        } = data.userInfo

        commit('SET_NAME', userName)
        commit('SET_AVATAR', logo)
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({
    commit,
    state
  }) {
    return new Promise((resolve, reject) => {
      logout(state.token).then(() => {
        commit('SET_TOKEN', '')
        commit('SET_ROUTES', '')
        removeToken('1')
        resetRouter()
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  getResources({
    commit,
    state
  }) {
    return new Promise((resolve, reject) => {
      getRoleResources(state.token).then((response) => {
        const {
          data
        } = response

        if (!data) {
          reject('Verification failed, please Login again.')
        }

        commit('SET_ROUTES', data)
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  showSideBar({
    commit
  }) {
    let showSideBarState = getToken() ? true : false;
    commit('SET_SIDEBAR', showSideBarState);
  },


  // remove token
  resetToken({
    commit
  }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      removeToken()
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}