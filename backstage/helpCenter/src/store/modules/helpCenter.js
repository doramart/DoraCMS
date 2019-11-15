import * as types from '../types.js';
import {
  helpCenterList,
} from '@/api/helpCenter';
import _ from 'lodash';




const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      name: '',
      type: '',
      lang: '1',
      user: {},
      comments: ''
    }
  },
  list: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.HELPCENTER_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      name: '',
      type: '',
      lang: '1',
      comments: ''
    }, formState.formData);
  },
  [types.HELPCENTER_LIST](state, list) {
    state.list = list
  },
}

const actions = {

  showHelpCenterForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.HELPCENTER_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },

  hideHelpCenterForm: ({
    commit
  }) => {
    commit(types.HELPCENTER_FORMSTATE, {
      show: false
    })
  },

  getHelpCenterList({
    commit
  }, params = {}) {
    helpCenterList(params).then((result) => {
      commit(types.HELPCENTER_LIST, result.data)
    })
  },


}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}