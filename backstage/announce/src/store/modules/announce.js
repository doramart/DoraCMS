import * as types from '../types.js';
import {
  getSystemAnnounceList,
} from '@/api/announce';
import _ from 'lodash';




const state = {
  systemAnnounce: {
    pageInfo: {},
    docs: []
  },
  announceFormState: {
    title: '',
    content: ''
  },
}

const mutations = {
  [types.SYSTEMANNOUNCE_LIST](state, list) {
    state.systemAnnounce = list
  },
  [types.SYSTEMANNOUNCE_FORMSTATE](state, formState) {
    state.announceFormState = Object.assign({
      title: '',
      content: ''
    }, formState.formData);

  },
}

const actions = {

  getSystemAnnounceList({
    commit
  }, params = {}) {
    getSystemAnnounceList(params).then((result) => {
      commit(types.SYSTEMANNOUNCE_LIST, result.data)
    })
  },
  showSysAnnounceForm: ({
    commit
  }, params = {}) => {
    commit(types.SYSTEMANNOUNCE_FORMSTATE, {
      formData: params
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}