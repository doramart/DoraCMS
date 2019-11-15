import * as types from '../types.js';
import {
  getSystemConfigs,
} from '@/api/systemConfig';
import _ from 'lodash';




const state = {
  configs: {
    siteName: '',
    ogTitle: '',
    siteDomain: '',
    siteDiscription: '',
    siteKeywords: '',
    siteEmailServer: '',
    siteEmail: '',
    siteEmailPwd: '',
    mongoDBPath: '',
    databackForderPath: '',
    bakDataRate: '1',
    statisticalCode: '',
    bakDatabyTime: false
  }
}

const mutations = {
  [types.SYSTEMCONFIG_CONFIGLIST](state, config) {
    state.configs = Object.assign({
      siteName: '',
      ogTitle: '',
      siteDomain: '',
      siteDiscription: '',
      siteKeywords: '',
      siteEmailServer: '',
      siteEmail: '',
      siteEmailPwd: '',
      mongoDBPath: '',
      databackForderPath: '',
      bakDataRate: '1',
      statisticalCode: '',
      bakDatabyTime: false
    }, config)
  },
}

const actions = {

  getSystemConfig({
    commit
  }, params = {}) {
    getSystemConfigs(params).then((config) => {
      let currentConfig = (config.data && config.data.docs) ? config.data.docs[0] : {};
      commit(types.SYSTEMCONFIG_CONFIGLIST, currentConfig)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}