import * as types from '../types.js';
import {
  getMyTemplateList,
} from '@/api/contentTemplate';
import _ from 'lodash';
import {
  renderTreeData
} from '@/utils';

const state = {
  formState: {
    show: false,
    edit: false,
    formData: {

    }
  },
  templateList: {
    pageInfo: {},
    docs: []
  },
  templateItemForderList: {}
}

const mutations = {
  [types.MYTEMPLATE_LIST](state, templateList) {
    state.templateList = templateList
  },
}

const actions = {

  getMyTemplateList({
    commit
  }, params = {}) {
    getMyTemplateList(params).then((result) => {
      commit(types.MYTEMPLATE_LIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}