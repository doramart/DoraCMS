import * as types from '../types.js';
import {
    adminGroupList,
} from '@/api/adminGroup';
import _ from 'lodash';

const state = {
    roleList: {
        pageInfo: {},
        docs: []
    },
}

const mutations = {

    [types.ADMINGROUP_LIST](state, rolelist) {
        state.roleList = rolelist
    },

}

const actions = {

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