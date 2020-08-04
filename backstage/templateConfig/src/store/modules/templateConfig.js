import * as types from '../types.js';
import {
  getMyTemplateList,
  getTemplateItemlist,
  getTemplatelistfromShop
} from '@/api/templateConfig';
import _ from 'lodash';




const state = {
  myTemplates: {
    formState: {
      show: false,
      edit: false,
      formData: {

      }
    },
    templateList: {
      // pageInfo: {},
      // docs: []
    },
    templateItemForderList: {}
  },
  tempShoplist: {
    pageInfo: {},
    docs: []
  },
}

const mutations = {
  [types.MYTEMPLATE_LIST](state, templateList) {
    state.myTemplates.templateList = templateList
  },
  [types.TEMPLATECONFIG_FORMSTATE](state, formState) {
    state.myTemplates.formState.show = formState.show;
    state.myTemplates.formState.edit = formState.edit;
    state.myTemplates.formState.formData = Object.assign({
      name: '',
      alias: '',
      comments: ''
    }, formState.formData);
  },
  [types.TEMPLATEITEMFORDER_LIST](state, forderList) {
    state.myTemplates.templateItemForderList = forderList
  },
  [types.DORACMSTEMPLATE_LIST](state, templist) {
    state.tempShoplist = templist
  },
}

const actions = {

  getMyTemplateList({
    commit
  }, params = {}) {
    getMyTemplateList(params).then((result) => {
      commit(types.MYTEMPLATE_LIST, result.data)
    })
  },
  showTemplateConfigForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.TEMPLATECONFIG_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideTemplateConfigForm: ({
    commit
  }) => {
    commit(types.TEMPLATECONFIG_FORMSTATE, {
      show: false
    })
  },
  getTemplateItemForderList({
    commit
  }, params = {}) {
    getTemplateItemlist(params).then((result) => {
      commit(types.TEMPLATEITEMFORDER_LIST, result.data)
    })
  },
  getTempsFromShop({
    commit
  }, params = {}) {
    getTemplatelistfromShop(params).then((result) => {
      commit(types.DORACMSTEMPLATE_LIST, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}