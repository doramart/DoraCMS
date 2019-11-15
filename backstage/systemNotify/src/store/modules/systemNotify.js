import * as types from '../types.js';
import {
  getSystemNotifyList,
} from '@/api/systemNotify';
import _ from 'lodash';

const state = {
  notifyList: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.SYSTEMNOTIFY_LIST](state, list) {
    state.notifyList = list
  },
}

const actions = {

  getSystemNotifyList({
    commit
  }, params = {}) {
    getSystemNotifyList(params).then((result) => {
      commit(types.SYSTEMNOTIFY_LIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}