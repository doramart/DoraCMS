import * as types from '../types.js';
import {
  adminUserList,
} from '@/api/adminUser';
import _ from 'lodash';

const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      name: '',
      userName: '',
      password: '',
      confirmPassword: '',
      group: '',
      email: '',
      comments: '',
      phoneNum: '',
      countryCode: '',
    }
  },
  userList: {
    pageInfo: {},
    docs: []
  },
}

const mutations = {
  [types.ADMINUSERFORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    if (!_.isEmpty(formState.formData)) {
      state.formState.formData = formState.formData
    } else {
      state.formState.formData = {
        name: '',
        userName: '',
        password: '',
        confirmPassword: '',
        group: '',
        email: '',
        comments: '',
        phoneNum: '',
        countryCode: '',
      }
    }

  },
  [types.ADMINUSERLIST](state, userlist) {
    state.userList = userlist
  },
}

const actions = {

  showAdminUserForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.ADMINUSERFORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideAdminUserForm: ({
    commit
  }) => {
    commit(types.ADMINUSERFORMSTATE, {
      show: false
    })
  },
  getAdminUserList({
    commit
  }, params = {}) {
    adminUserList(params).then((result) => {
      commit(types.ADMINUSERLIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}