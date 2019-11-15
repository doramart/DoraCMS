import * as types from '../types.js';
import {
  adminResourceList,
} from '@/api/adminResource';
import _ from 'lodash';


export function renderTreeData(result) {
  let newResult = result;
  let treeData = newResult.docs;
  let childArr = _.filter(treeData, (doc) => {
    return doc.parentId != '0'
  });

  for (let i = 0; i < childArr.length; i++) {
    let child = childArr[i];
    for (let j = 0; j < treeData.length; j++) {
      let treeItem = treeData[j];
      if (treeItem._id == child.parentId || treeItem.id == child.parentId) {
        if (!treeItem.children) treeItem.children = [];
        treeItem.children.push(child);
        break;
      }
    }
  }

  newResult.docs = _.filter(treeData, (doc) => {
    return doc.parentId == '0'
  });
  return newResult;
}


const state = {
  resourceList: {
    pageInfo: {},
    docs: []
  },
}

const mutations = {
  [types.ADMINRESOURCE_LIST](state, resourceList) {
    state.resourceList = resourceList
  },
}

const actions = {

  getAdminResourceList({
    commit
  }, params = {}) {
    adminResourceList(params).then((result) => {
      let treeData = renderTreeData(result.data);
      if (!_.isEmpty(treeData)) {
        commit(types.ADMINRESOURCE_LIST, treeData)
      }
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}