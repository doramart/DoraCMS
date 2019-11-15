import * as types from '../types.js';
import {
  versionManageList,
} from '@/api/versionManage';
import _ from 'lodash';




const state = {
  versionManage: {
    configs: {
      title: '',
      description: '',
      version: '',
      versionName: '',
      forcibly: false,
      url: ''
    }
  },
  versionManageIos: {
    configs: {
      title: '',
      description: '',
      version: '',
      versionName: '',
      forcibly: false,
      url: ''
    }
  },
}

const mutations = {
  [types.VERSIONMANAGE_FORMSTATE](state, config) {
    state.versionManage.configs = Object.assign({
      title: '',
      description: '',
      version: '',
      versionName: '',
      forcibly: false,
      url: ''
    }, config)
  },

  [types.VERSIONMANAGEIOS_FORMSTATE](state, config) {
    state.versionManageIos.configs = Object.assign({
      title: '',
      description: '',
      version: '',
      versionName: '',
      forcibly: false,
      url: ''
    }, config)
  },
}

const actions = {

  getVersionInfo({
    commit
  }, params = {
    client: '0'
  }) {
    versionManageList(params).then((config) => {
      let currentConfig = (config.data && config.data.docs) ? config.data.docs[0] : {};
      commit(types.VERSIONMANAGE_FORMSTATE, currentConfig)
    })
  },
  getIosVersionInfo({
    commit
  }, params = {
    client: '1'
  }) {
    versionManageList(params).then((config) => {
      let currentConfig = (config.data && config.data.docs) ? config.data.docs[0] : {};
      commit(types.VERSIONMANAGEIOS_FORMSTATE, currentConfig)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}