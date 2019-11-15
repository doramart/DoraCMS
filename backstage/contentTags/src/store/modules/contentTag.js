import * as types from '../types.js';
import {
  contentTagList,
} from '@/api/contentTag';
import _ from 'lodash';




const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      name: '',
      alias: '',
      comments: ''
    }
  },
  tagList: {
    pageInfo: {},
    docs: []
  },
}

const mutations = {
  [types.CONTENTTAG_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      name: '',
      alias: '',
      comments: ''
    }, formState.formData);

  },
  [types.CONTENTTAG_LIST](state, tagList) {
    state.tagList = tagList
  },
}

const actions = {

  showContentTagForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.CONTENTTAG_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideContentTagForm: ({
    commit
  }) => {
    commit(types.CONTENTTAG_FORMSTATE, {
      show: false
    })
  },
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