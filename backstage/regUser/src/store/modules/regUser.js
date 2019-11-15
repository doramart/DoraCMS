import * as types from '../types.js';
import {
  regUserList,
} from '@/api/regUser';
import _ from 'lodash';




const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      name: '',
      userName: '',
      group: '',
      watchers: [],
      followers: [],
      category: [],
      email: '',
      comments: '',
      phoneNum: '',
      enable: true,
      integral: 0
    }
  },
  userList: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.REGUSERFORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;

    state.formState.formData = Object.assign({
      name: '',
      userName: '',
      group: '',
      email: '',
      comments: '',
      phoneNum: '',
      enable: true
    }, formState.formData);

  },
  [types.REGUSERLIST](state, userlist) {
    state.userList = userlist
  },
}

const actions = {

  showRegUserForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.REGUSERFORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideRegUserForm: ({
    commit
  }) => {
    commit(types.REGUSERFORMSTATE, {
      show: false
    })
  },
  getRegUserList({
    commit
  }, params = {}) {
    regUserList(params).then((result) => {
      commit(types.REGUSERLIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}