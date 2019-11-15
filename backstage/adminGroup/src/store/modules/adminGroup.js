import * as types from '../types.js';
import {
    adminGroupList,
} from '@/api/adminGroup';
import _ from 'lodash';

const state = {
    formState: {
        show: false,
        edit: false,
        formData: {
            name: '',
            comments: '',
            enable: false,
            power: []
        }
    },
    roleFormState: {
        show: false,
        edit: true,
        formData: {
            name: '',
            comments: '',
            enable: false,
            power: []
        }
    },
    roleList: {
        pageInfo: {},
        docs: []
    },
}

const mutations = {

    [types.ADMINGROUP_FORMSTATE](state, formState) {
        state.formState.show = formState.show;
        state.formState.edit = formState.edit;
        if (!_.isEmpty(formState.formData)) {
            state.formState.formData = formState.formData
        } else {
            state.formState.formData = {
                name: '',
                comments: '',
                enable: false
            }
        }

    },
    [types.ADMINGROUP_ROLEFORMSTATE](state, formState) {
        state.roleFormState.show = formState.show;
        state.roleFormState.edit = formState.edit;
        state.roleFormState.formData = Object.assign({
            name: '',
            comments: '',
            enable: false,
            power: []
        }, formState.formData);
    },
    [types.ADMINGROUP_LIST](state, rolelist) {
        state.roleList = rolelist
    },

}

const actions = {

    showAdminGroupForm: ({
        commit
      }, params = {
        edit: false,
        formData: {}
      }) => {
        commit(types.ADMINGROUP_FORMSTATE, {
          show: true,
          edit: params.edit,
          formData: params.formData
        })
      },
      hideAdminGroupForm: ({
        commit
      }) => {
        commit(types.ADMINGROUP_FORMSTATE, {
          show: false
        })
      },
      showAdminGroupRoleForm: ({
        commit
      }, params = {
        edit: false,
        formData: {}
      }) => {
        commit(types.ADMINGROUP_ROLEFORMSTATE, {
          show: true,
          edit: params.edit,
          formData: params.formData
        })
      },
      hideAdminGroupRoleForm: ({
        commit
      }) => {
        commit(types.ADMINGROUP_ROLEFORMSTATE, {
          show: false
        })
      },
    getAdminGroupList({
        commit
    }, params = {}) {
        adminGroupList(params).then((result) => {
            commit(types.ADMINGROUP_LIST, result.data)
        })
    },

}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}