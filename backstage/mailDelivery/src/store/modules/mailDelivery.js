import * as types from '../types.js';
import {
  mailDeliveryList,
  mailTemplateList,
  sendLogList
} from '@/api/mailDelivery';
import _ from 'lodash';




const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      // STOREPROPSSTR
    }
  },
  sendLogFormState: {
    show: false,
  },
  sendLogList: {
    pageInfo: {},
    docs: []
  },
  list: {
    pageInfo: {},
    docs: []
  },
  templist: {

  }
}

const mutations = {
  [types.MAILDELIVERY_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      // STOREPROPSSTR
    }, formState.formData);
  },
  [types.MAILDELIVERY_LIST](state, list) {
    state.list = list
  },

  [types.MAILTEMPLATE_LIST](state, templist) {
    state.templist = templist
  },

  [types.MAIL_SENDLOG_FORMSTATE](state, sendLogFormState) {
    state.sendLogFormState.show = sendLogFormState.show;
  },

  [types.MAIL_SENDLOG_LIST](state, list) {
    state.sendLogList = list
  },

}

const actions = {

  showMailDeliveryForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.MAILDELIVERY_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },

  hideMailDeliveryForm: ({
    commit
  }) => {
    commit(types.MAILDELIVERY_FORMSTATE, {
      show: false
    })
  },

  getMailDeliveryList({
    commit
  }, params = {}) {
    mailDeliveryList(params).then((result) => {
      commit(types.MAILDELIVERY_LIST, result.data)
    })
  },

  getMailTemplateList({
    commit
  }, params = {}) {
    mailTemplateList(params).then((result) => {
      commit(types.MAILTEMPLATE_LIST, result.data)
    })
  },

  showSendLogForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.MAIL_SENDLOG_FORMSTATE, {
      show: true,
    })
  },

  hideSendLogForm: ({
    commit
  }) => {
    commit(types.MAIL_SENDLOG_FORMSTATE, {
      show: false
    })
  },

  sendLogList({
    commit
  }, params = {}) {
    sendLogList(params).then((result) => {
      commit(types.MAIL_SENDLOG_LIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}