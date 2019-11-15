import * as types from '../types.js';
import {
  projectConfigrationList,
} from '@/api/renderCms';
import _ from 'lodash';


const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      tableName: '',
      localPath: '',
      type: '',
    }
  },
  list: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.PROJECTCONFIGURATION_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      tableName: '',
      localPath: '',
      type: '',
    }, formState.formData);
  },
  [types.PROJECTCONFIGURATION_LIST](state, list) {
    state.list = list
  },
}

const actions = {

  showProjectConfigurationForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.PROJECTCONFIGURATION_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },

  hideProjectConfigurationForm: ({
    commit
  }) => {
    commit(types.PROJECTCONFIGURATION_FORMSTATE, {
      show: false
    })
  },

  getProjectConfigurationList({
    commit
  }, params = {}) {
    projectConfigrationList(params).then((result) => {
      commit(types.PROJECTCONFIGURATION_LIST, result.data)
    })
  },


}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}