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
  formState: {
    type: 'root',
    show: false,
    edit: false,
    formData: {
      label: '',
      type: '',
      api: '',
      icon: '',
      routePath: '',
      componentPath: '',
      enable: true,
      parentId: '',
      sortId: 0,
      comments: '',
      parent: {
        id: '',
        label: ''
      }
    }
  },
  selectFormState: {
    type: 'root',
    show: false,
    edit: false,
    formData: {
      parentId: ''
    }
  },
  resourceList: {
    pageInfo: {},
    docs: []
  },
}

const mutations = {
  [types.ADMINRESOURCE_LIST](state, resourceList) {
    state.resourceList = resourceList
  },
  [types.ADMINRESOURCE_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      label: '',
      type: '',
      api: '',
      icon: '',
      routePath: '',
      componentPath: '',
      enable: true,
      parentId: '',
      sortId: 0,
      comments: '',
      parent: {
        id: '',
        label: ''
      }
    }, formState.formData);

  },
  [types.ADMINSELECTRESOURCE_FORMSTATE](state, formState) {
    state.selectFormState.show = formState.show;
    state.selectFormState.edit = formState.edit;
    state.selectFormState.type = formState.type;
    state.selectFormState.formData = Object.assign({
      parentId: ''
    }, formState.formData);

  },
}

const actions = {

  showAdminResourceForm: ({
    commit
  }, params = {
    type: 'root',
    edit: false,
    formData: {}
  }) => {
    commit(types.ADMINRESOURCE_FORMSTATE, {
      show: true,
      type: params.type,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideAdminResourceForm: ({
    commit
  }) => {
    commit(types.ADMINRESOURCE_FORMSTATE, {
      show: false
    })
  },
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
  showAdminSelectResourceForm: ({
    commit
  }, params = {
    type: 'root',
    edit: false,
    formData: {}
  }) => {
    commit(types.ADMINSELECTRESOURCE_FORMSTATE, {
      show: true,
      type: params.type,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideAdminSelectResourceForm: ({
    commit
  }) => {
    commit(types.ADMINSELECTRESOURCE_FORMSTATE, {
      show: false
    })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}