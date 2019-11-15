import * as types from '../types.js';
import {
  getBakDataList,
} from '@/api/backUpData';
import _ from 'lodash';




const state = {
  bakDataList: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.BAKUPDATA_LIST](state, list) {
    state.bakDataList = list || []
  },
}

const actions = {

  getBakDateList({
    commit
  }, params = {}) {
    getBakDataList(params).then((result) => {
      commit(types.BAKUPDATA_LIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}