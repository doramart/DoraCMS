import * as types from '../types.js';
import {
  getSystemOptionLogsList,
} from '@/api/systemOptionLog';
import _ from 'lodash';




const state = {
  systemOptionLogs: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.SYSTEMOPTIONLOGS_LIST](state, list) {
    state.systemOptionLogs = list
  },
}

const actions = {

  getSystemLogsList({
    commit
  }, params = {}) {
    getSystemOptionLogsList(params).then((result) => {
      commit(types.SYSTEMOPTIONLOGS_LIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}