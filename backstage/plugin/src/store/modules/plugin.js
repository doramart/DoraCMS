import * as types from '../types.js';
import {
  pluginList,
  shopPluginList
} from '@/api/plugin';
import _ from 'lodash';




const state = {
  formState: {
    show: false,
    edit: false,
    formData: {
      name: '',
      type: '',
      lang: '1',
      user: {},
      comments: ''
    }
  },
  list: {
    pageInfo: {},
    docs: []
  },
  shopList: {
    pageInfo: {},
    docs: []
  }
}

const mutations = {
  [types.PLUGINMANAGE_FORMSTATE](state, formState) {
    state.formState.show = formState.show;
    state.formState.edit = formState.edit;
    state.formState.type = formState.type;
    state.formState.formData = Object.assign({
      name: '',
      type: '',
      lang: '1',
      comments: ''
    }, formState.formData);
  },
  [types.PLUGINMANAGE_LIST](state, list) {
    state.list = list
  },
  [types.SHOPPLUGINMANAGE_LIST](state, list) {
    state.shopList = list
  },
}

const actions = {

  showPluginForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.PLUGINMANAGE_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },

  hidePluginForm: ({
    commit
  }) => {
    commit(types.PLUGINMANAGE_FORMSTATE, {
      show: false
    })
  },

  getPluginList({
    commit
  }, params = {}) {
    pluginList(params).then((result) => {
      commit(types.PLUGINMANAGE_LIST, result.data)
    })
  },


  getShopPluginList({
    commit
  }, params = {}) {
    shopPluginList(params).then((result) => {
      commit(types.SHOPPLUGINMANAGE_LIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}