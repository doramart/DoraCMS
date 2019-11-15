import * as types from '../types.js';
import _ from 'lodash';
import {
  logOut,
  getUserInfo
} from '@/api/singleUser'
import {
  getToken,
  setToken,
  removeToken
} from '@root/publicMethods/auth'


const state = {
  token: getToken('1'),
  userInfo: {},
  formState: {
    show: false,
    edit: false,
    formData: {
      // STOREPROPSSTR
    },
    regFormData: {}
  }
}

const mutations = {

  [types.SINGLEUSER_INFO](state, userInfo) {
    state.userInfo = userInfo
  },
  [types.SINGLEUSER_SET_TOKEN](state, token) {
    state.token = token
  },
  [types.SINGLEUSER_SET_NAME](state, name) {
    state.name = name
  },
  [types.SINGLEUSER_SET_AVATAR](state, avatar) {
    state.avatar = avatar
  },
  [types.SINGLEUSER_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.messageInfo = formState.messageInfo;
    state.formState.formData = Object.assign({
      // STOREPROPSSTR
    }, formState.formData);
    state.formState.regFormData = Object.assign({
      // STOREPROPSSTR
    }, formState.regFormData);
  },
}

const actions = {

  showSingleUserForm: ({
    commit
  }, params = {
    edit: false,
    messageInfo: {},
    formData: {},
    regFormData: {}
  }) => {
    commit(types.SINGLEUSER_FORMSTATE, {
      show: true,
      edit: params.edit,
      messageInfo: params.messageInfo,
      formData: params.formData,
      regFormData: params.regFormData,
    })
  },
  hideSingleUserForm: ({
    commit
  }) => {
    commit(types.SINGLEUSER_FORMSTATE, {
      show: false
    })
  },

  setUserInfo: ({
    commit
  }, params = {
    userInfo: {}
  }) => {
    if (!_.isEmpty(params.userInfo)) {
      commit(types.SINGLEUSER_SET_NAME, params.userInfo.userName)
      commit(types.SINGLEUSER_SET_AVATAR, params.userInfo.logo)
      commit(types.SINGLEUSER_SET_TOKEN, params.userInfo.token)
      setToken(params.userInfo.token, '1');
      commit(types.SINGLEUSER_INFO, params.userInfo)
    }
  },

  getUserInfo({
    commit,
    state
  }) {
    return new Promise((resolve, reject) => {
      getUserInfo({
        singleUserToken: state.token
      }).then(response => {
        const {
          data
        } = response

        if (!_.isEmpty(data)) {
          const {
            userName,
            logo
          } = data
          commit(types.SINGLEUSER_INFO, data)
          commit(types.SINGLEUSER_SET_NAME, userName)
          commit(types.SINGLEUSER_SET_AVATAR, logo)
        }

        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logOut({
    commit,
    state
  }) {
    return new Promise((resolve, reject) => {
      logOut({
        singleUserToken: state.token
      }).then(() => {
        commit(types.SINGLEUSER_SET_TOKEN, '')
        commit(types.SINGLEUSER_INFO, {})
        removeToken('1')
        resolve()
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