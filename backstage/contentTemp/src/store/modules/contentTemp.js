import * as types from '../types.js';
import {
  adminTemplateList,
} from '@/api/contentTemp';
import {
  renderTreeData,
} from '@/utils';
import _ from 'lodash';




const state = {
  templateList: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.ADMINTEMPLATE_LIST](state, templateList) {
    state.templateList = templateList
  },
}

const actions = {

  getAdminTemplateList({
    commit
  }, params = {}) {
    adminTemplateList(params).then((result) => {
      let treeData = renderTreeData(result.data);
      commit(types.ADMINTEMPLATE_LIST, treeData)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}