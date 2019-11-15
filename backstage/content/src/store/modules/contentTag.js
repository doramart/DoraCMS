import * as types from '../types.js';
import {
  contentTagList,
} from '@/api/contentTag';
import _ from 'lodash';


const state = {

  tagList: {
    pageInfo: {},
    docs: []
  },

}

const mutations = {
  [types.CONTENTTAG_LIST](state, tagList) {
    state.tagList = tagList
  },
}

const actions = {

  getContentTagList({
    commit
  }, params = {}) {
    contentTagList(params).then((result) => {
      commit(types.CONTENTTAG_LIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}