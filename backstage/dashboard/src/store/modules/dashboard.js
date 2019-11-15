import * as types from '../types.js';
import {
  getSiteBasicInfo,
  getUserSession
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
  }
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

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}