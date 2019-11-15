import * as types from '../types.js';
import {
  getAdsList,
} from '@/api/ads';
import _ from 'lodash';

const state = {
  list: {
    pageInfo: {},
    docs: []
  },
  infoFormState: {
    edit: false,
    formData: {
      name: '',
      type: '1',
      height: '',
      comments: '',
      items: [],
      state: true,
      carousel: true
    }
  },
  itemFormState: {
    show: false,
    edit: false,
    formData: {
      title: '',
      link: '',
      appLink: '',
      appLinkType: '',
      width: '',
      height: '',
      alt: '',
      sImg: ''
    }
  }
}

const mutations = {
  [types.ADS_LIST](state, list) {
    state.list = list
  },
  [types.ADS_INFO_FORMSTATE](state, formState) {
    state.infoFormState.edit = formState.edit;
    state.infoFormState.formData = Object.assign({
      name: '',
      type: '1',
      height: '',
      comments: '',
      items: [],
      state: true,
      carousel: true
    }, formState.formData);
  },
  [types.ADS_ITEM_FORMSTATE](state, formState) {
    state.itemFormState.edit = formState.edit;
    state.itemFormState.show = formState.show;
    state.itemFormState.formData = Object.assign({
      title: '',
      link: '',
      width: '',
      height: '',
      alt: '',
      sImg: '',
    }, formState.formData);
  },
}

const actions = {

  getAdsList({
    commit
  }, params = {}) {
    getAdsList(params).then((result) => {
      commit(types.ADS_LIST, result.data)
    })
  },
  adsInfoForm: ({
    commit
  }, params = {}) => {
    commit(types.ADS_INFO_FORMSTATE, {
      edit: params.edit,
      formData: params.formData
    })
  },
  showAdsItemForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.ADS_ITEM_FORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideAdsItemForm: ({
    commit
  }) => {
    commit(types.ADS_ITEM_FORMSTATE, {
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