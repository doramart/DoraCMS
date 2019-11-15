import * as types from '../types.js';
import {
  contentMessageList,
} from '@/api/contentMessage';
import _ from 'lodash';




const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      contentId: '',
      content: '',
      author: '',
      replyId: '',
      relationMsgId: ''
    },
    parentformData: {
      contentId: '',
      content: '',
      author: '',
      replyId: '',
      relationMsgId: ''
    }
  },
  messageList: {
    pageInfo: {},
    docs: []
  },
}

const mutations = {
  [types.CONTENTMESSAGE_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      contentId: '',
      content: '',
      replyId: '',
      author: '',
      relationMsgId: ''
    }, formState.formData);
    state.formState.parentformData = Object.assign({
      contentId: '',
      content: '',
      replyId: '',
      author: '',
      relationMsgId: ''
    }, formState.parentformData);
  },
  [types.CONTENTMESSAGE_LIST](state, messageList) {
    state.messageList = messageList
  },
}

const actions = {

  showContentMessageForm: ({
    commit
  }, params = {
    edit: false,
    formData: {},
    parentformData: {}
  }) => {
    commit(types.CONTENTMESSAGE_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData,
      parentformData: params.parentformData
    })
  },
  hideContentMessageForm: ({
    commit
  }) => {
    commit(types.CONTENTMESSAGE_FORMSTATE, {
      show: false
    })
  },
  getContentMessageList({
    commit
  }, params = {}) {
    contentMessageList(params).then((result) => {
      commit(types.CONTENTMESSAGE_LIST, result.data)
    })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}