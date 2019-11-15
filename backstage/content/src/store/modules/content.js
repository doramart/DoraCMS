import * as types from '../types.js';
import {
  contentList,
  getOneContent
} from '@/api/content';
import _ from 'lodash';


const state = {
  formState: {
    edit: false,
    formData: {
      targetUser: '',
      title: '',
      stitle: '',
      type: '1',
      categories: [],
      keywords: '',
      sortPath: '',
      tags: [],
      keywords: '',
      sImg: '/static/upload/images/defaultImg.jpg',
      discription: '',
      author: {},
      uAuthor: '',
      markDownComments: '',
      state: '1',
      isTop: 0,
      roofPlacement: '0',
      clickNum: 0,
      comments: '',
      simpleComments: '',
      commentNum: 0,
      likeNum: 0,
      dismissReason: '',

    }
  },
  contentList: {
    pageInfo: {},
    docs: []
  },
  directUser: {
    formState: {
      show: false,
      edit: false,
      formData: {
        name: '',
        alias: '',
        targetUser: ''
      }
    }
  },
}

const mutations = {
  [types.CONTENT_FORMSTATE](state, formState) {
    state.formState.edit = formState.edit;
    state.formState.formData = Object.assign({
      targetUser: '',
      title: '',
      stitle: '',
      type: '1',
      categories: [],
      keywords: '',
      sortPath: '',
      tags: [],
      keywords: '',
      sImg: '',
      discription: '',
      author: {},
      uAuthor: '',
      markDownComments: '',
      state: '1',
      isTop: 0,
      roofPlacement: '0',
      clickNum: 0,
      comments: '',
      simpleComments: '',
      commentNum: 0,
      likeNum: 0
    }, formState.formData);

  },
  [types.CONTENT_LIST](state, contentList) {
    state.contentList = contentList
  },
  [types.CONTENT_ONE](state, content) {
    state.content = content
  },
  [types.DIRECTUSERFORMSTATE](state, formState) {
    state.directUser.formState.show = formState.show;
    state.directUser.formState.edit = formState.edit;
    state.directUser.formState.type = formState.type;
    state.directUser.formState.formData = Object.assign({
      name: '',
      alias: '',
      targetUser: ''
    }, formState.formData);
  },
}

const actions = {

  showContentForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.CONTENT_FORMSTATE, {
      edit: params.edit,
      formData: params.formData
    })
  },
  showDirectUserForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.DIRECTUSERFORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideDirectUserForm: ({
    commit
  }) => {
    commit(types.DIRECTUSERFORMSTATE, {
      show: false
    })
  },
  getContentList({
    commit
  }, params = {}) {
    contentList(params).then((result) => {
      commit(types.CONTENT_LIST, result.data)
    })
  },

  getOneContent({
    commit
  }, params = {}) {
    getOneContent(params).then((result) => {
      commit(types.CONTENT_ONE, result.data)
    })
  },

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}