import {
  getInfo
} from '@/api/adminUser'
import {
  getToken,
  removeToken
} from '@root/publicMethods/auth'


const state = {
  token: getToken(),
  userInfo: ""
}


const mutations = {

  SET_ADMINUSERINFO: (state, adminUserInfo) => {
    state.userInfo = adminUserInfo
  },

}

const actions = {

  // get user info
  getUserInfo({
    commit,
    state
  }) {
    return new Promise((resolve, reject) => {
      getInfo().then(response => {
        const {
          data
        } = response

        if (!data) {
          reject('Verification failed, please Login again.')
        }
        commit("SET_ADMINUSERINFO", data.userInfo);
      }).catch(error => {
        reject(error)
      })
    })
  },


}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}