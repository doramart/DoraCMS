import * as types from '../types.js';
import {
  mailTemplateList,
  mailTemplateTypeList
} from '@/api/mailTemplate';
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
  },
  typelist: {

  }
}

const mutations = {
  [types.MAILTEMPLATE_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      // STOREPROPSSTR
    }, formState.formData);
  },
  [types.MAILTEMPLATE_LIST](state, list) {
    state.list = list
  },
  [types.MAILTEMPLATE_TYPE_LIST](state, typelist) {
    state.typelist = typelist
  },
}

const actions = {

  showMailTemplateForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.MAILTEMPLATE_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },

  hideMailTemplateForm: ({
    commit
  }) => {
    commit(types.MAILTEMPLATE_FORMSTATE, {
      show: false
    })
  },

  getMailTemplateList({
    commit
  }, params = {}) {
    mailTemplateList(params).then((result) => {
      commit(types.MAILTEMPLATE_LIST, result.data)
    })
  },

  getMailTemplateTypeList({
    commit
  }, params = {}) {
    mailTemplateTypeList(params).then((result) => {
      commit(types.MAILTEMPLATE_TYPE_LIST, result.data)
    })
  },


}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}