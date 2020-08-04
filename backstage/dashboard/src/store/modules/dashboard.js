import * as types from '../types.js';
import {
  getSiteBasicInfo,
  getUserSession,
  getClientNotice,
  getVersionMaintenanceInfo
} from '@/api/dashboard';
import _ from 'lodash';


const state = {
  basicInfo: {
    adminUserCount: 0,
    regUserCount: 0,
    contentCount: 0,
    messageCount: 0
  },
  loginState: {
    state: false,
    userInfo: {
      userName: '',
      email: '',
      logo: '',
      group: []
    },
    noticeCounts: 0
  },
  notice: [],
  versionInfo: []
}

const mutations = {
  [types.MAIN_SITEBASIC_INFO](state, list) {
    state.basicInfo = list
  },
  [types.ADMING_LOGINSTATE](state, params) {
    state.loginState = Object.assign({
      userInfo: {
        userName: '',
        email: '',
        logo: '',
        group: []
      },
      state: false
    }, {
      userInfo: params.userInfo,
      state: params.loginState || false,
      noticeCounts: params.noticeCounts
    });
  },
  [types.CLIENT_NOTICE](state, list) {
    state.notice = list
  },
  [types.SYSTEM_VERSION_INFO](state, list) {
    state.versionInfo = list.length > 0 ? list[0] : {}
  },
}

const actions = {

  getSiteBasicInfo({
    commit
  }, params = {}) {
    getSiteBasicInfo(params).then((result) => {
      commit(types.MAIN_SITEBASIC_INFO, result.data)
    })
  },
  loginState: ({
    commit
  }, params = {
    userInfo: {},
    state: false
  }) => {
    getUserSession().then((result) => {
      commit(types.ADMING_LOGINSTATE, result.data)
    })
  },

  getNotice: ({
    commit
  }, params = {}) => {
    getClientNotice(params).then((result) => {
      commit(types.CLIENT_NOTICE, result.data)
    })
  },

  getVersionMaintenanceInfo: ({
    commit
  }, params = {}) => {
    getVersionMaintenanceInfo(params).then((result) => {
      commit(types.SYSTEM_VERSION_INFO, result.data)
    })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}