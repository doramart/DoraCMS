import * as types from '../types.js';
import {
  hooksList,
} from '@/api/hooks';
import _ from 'lodash';




const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      // STOREPROPSSTR
    }
  },
  list: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.HOOKS_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      // STOREPROPSSTR
    }, formState.formData);
  },
  [types.HOOKS_LIST](state, list) {
    state.list = list
  },
}

const actions = {

  showHookForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.HOOKS_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },

  hideHookForm: ({
    commit
  }) => {
    commit(types.HOOKS_FORMSTATE, {
      show: false
    })
  },

  getHookList({
    commit
  }, params = {}) {
    hooksList(params).then((result) => {
      commit(types.HOOKS_LIST, result.data)
    })
  },


}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}