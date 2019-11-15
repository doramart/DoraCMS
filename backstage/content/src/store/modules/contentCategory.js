import * as types from '../types.js';
import {
  contentCategoryList
} from '@/api/contentCategory';
import _ from 'lodash';
import {
  renderTreeData
} from '@/utils';


const state = {
  categoryList: {
    pageInfo: {},
    docs: []
  },
}

const mutations = {
  [types.CONTENTCATEGORYS_LIST](state, categoryList) {
    state.categoryList = categoryList
  },
}

const actions = {

  getContentCategoryList({
    commit
  }, params = {}) {
    contentCategoryList(params).then((result) => {
      let treeData = renderTreeData({
        docs: result.data
      });
      commit(types.CONTENTCATEGORYS_LIST, treeData)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}