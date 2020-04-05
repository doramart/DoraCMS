import * as types from '../types.js';
import {
  contentList,
  getOneContent,
  coverList
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
      sImgType: '2',
      cover: '',
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
  moveCate: {
    formState: {
      show: false,
      edit: false,
      formData: {
        categories: ''
      }
    }
  },
  contentCoverDialog: {
    show: false,
  },
  contentCoverList: {
    pageInfo: {},
    docs: []
  },
  draftContentDialog: {
    show: false,
  },
  draftContentList: {
    pageInfo: {},
    docs: []
  }
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
      sImgType: '2',
      cover: '',
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
  [types.CONTENT_MOVECATEFORMSTATE](state, formState) {
    state.moveCate.formState.show = formState.show;
    state.moveCate.formState.edit = formState.edit;
    state.moveCate.formState.type = formState.type;
    state.moveCate.formState.formData = Object.assign({
      categories: ''
    }, formState.formData);
  },
  [types.CONTENT_COVERDIALOGSTAGE](state, formState) {
    state.contentCoverDialog.show = formState.show;
  },
  [types.CONTENT_COVERLIST](state, contentCoverList) {
    state.contentCoverList = contentCoverList
  },
  [types.CONTENT_DRAFTDIALOGSTAGE](state, formState) {
    state.draftContentDialog.show = formState.show;
  },
  [types.CONTENT_DRAFTLIST](state, draftList) {
    state.draftContentList = draftList
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
  showMoveCateForm: ({
    commit
  }, params = {
    edit: false,
    formData: {}
  }) => {
    commit(types.CONTENT_MOVECATEFORMSTATE, {
      show: true,
      edit: params.edit,
      formData: params.formData
    })
  },
  hideMoveCateForm: ({
    commit
  }) => {
    commit(types.CONTENT_MOVECATEFORMSTATE, {
      show: false
    })
  },
  showCoverListDialog: ({
    commit
  }, params = {
    edit: false,

  }) => {
    commit(types.CONTENT_COVERDIALOGSTAGE, {
      show: true,
    })
  },
  hideCoverListDialog: ({
    commit
  }) => {
    commit(types.CONTENT_COVERDIALOGSTAGE, {
      show: false
    })
  },
  showDraftListDialog: ({
    commit
  }, params = {
    edit: false,

  }) => {
    commit(types.CONTENT_DRAFTDIALOGSTAGE, {
      show: true,
    })
  },
  hideDraftListDialog: ({
    commit
  }) => {
    commit(types.CONTENT_DRAFTDIALOGSTAGE, {
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

  getContentCoverList({
    commit
  }, params = {}) {
    coverList(params).then((result) => {
      commit(types.CONTENT_COVERLIST, result.data)
    })
  },

  getDraftContentList({
    commit
  }, params = {
    draft: '1'
  }) {
    contentList(params).then((result) => {
      commit(types.CONTENT_DRAFTLIST, result.data)
    })
  },


}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}