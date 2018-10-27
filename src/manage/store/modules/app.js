import Cookies from 'js-cookie'
import * as types from '../types.js';
import services from '../services.js';
import _ from 'lodash';

export function renderTreeData(result) {
  let newResult = result;
  let treeData = newResult.docs;
  let childArr = _.filter(treeData, (doc) => {
      return doc.parentId != '0'
  });

  for (let i = 0; i < childArr.length; i++) {
      let child = childArr[i];
      for (let j = 0; j < treeData.length; j++) {
          let treeItem = treeData[j];
          if (treeItem._id == child.parentId || treeItem.id == child.parentId) {
              if (!treeItem.children) treeItem.children = [];
              treeItem.children.push(child);
              break;
          }
      }
  }

  newResult.docs = _.filter(treeData, (doc) => {
      return doc.parentId == '0'
  });
  return newResult;
}

const app = {
  state: {
    sidebar: {
      opened: !+Cookies.get('sidebarStatus'),
      withoutAnimation: false
    },
    device: 'desktop',
    language: Cookies.get('language') || 'en',
    size: Cookies.get('size') || 'medium',
    count: 20,
    loginState: {
      state: false,
      userInfo: {
        userName: '',
        email: '',
        logo: '',
        group: []
      },
      noticeCounts: 0
    },
    adminUser: {
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
          phoneNum: ''
        }
      },
      userList: {
        pageInfo: {},
        docs: []
      },
      addUser: {
        state: '',
        err: {}
      }
    },
    adminGroup: {
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
      addGroup: {
        state: '',
        err: {}
      }
    },
    adminResource: {
      formState: {
        type: 'root',
        show: false,
        edit: false,
        formData: {
          label: '',
          type: '',
          api: '',
          icon: '',
          routePath: '',
          componentPath: '',
          enable: true,
          parentId: '',
          sortId: 0,
          comments: '',
          parent: {
            id: '',
            label: ''
          }
        }
      },
      resourceList: {
        pageInfo: {},
        docs: []
      },
      addResource: {
        state: '',
        err: {}
      }
    },
    adminTemplate: {
      formState: {

      },
      templateList: {
        pageInfo: {},
        docs: []
      }
    },
    myTemplates: {
      formState: {
        show: false,
        edit: false,
        formData: {

        }
      },
      templateList: {
        pageInfo: {},
        docs: []
      },
      templateItemForderList: {}
    },
    tempShoplist: {
      pageInfo: {},
      docs: []
    },
    systemConfig: {
      configs: {
        siteName: '',
        siteDomain: '',
        siteDiscription: '',
        siteKeywords: '',
        siteEmailServer: '',
        siteEmail: '',
        siteEmailPwd: '',
        mongoDBPath: '',
        databackForderPath: '',
        poseArticlScore: '',
        postMessageScore: '',
        shareArticlScore: '',
        bakDataRate: '1',
        bakDatabyTime: false
      }
    },
    contentCategory: {
      formState: {
        type: 'root',
        show: false,
        edit: false,
        formData: {
          label: '',
          enable: false,
          defaultUrl: '',
          parentId: '',
          contentTemp: '',
          parentObj: '',
          sortId: 0,
          comments: '',
          type: '1'
        }
      },
      categoryList: {
        pageInfo: {},
        docs: []
      },
      addContentCategory: {
        state: '',
        err: {}
      }
    },
    content: {
      formState: {
        edit: false,
        formData: {
          title: '',
          stitle: '',
          type: '1',
          categories: [],
          sortPath: '',
          tags: [],
          keywords: '',
          sImg: '/upload/images/defaultImg.jpg',
          discription: '',
          author: {},
          uAuthor: '',
          markDownComments: '',
          state: true,
          isTop: 0,
          clickNum: 0,
          comments: '',
          commentNum: 0,
          likeNum: 0,
          likeUserIds: '',
          from: '1',
          postValue: 3,
          translate: '',
          twiterAuthor: ''

        }
      },
      contentList: {
        pageInfo: {},
        docs: []
      },
      addContent: {
        state: '',
        err: {}
      }
    },
    contentTag: {
      formState: {
        show: false,
        edit: false,
        formData: {
          name: '',
          alias: '',
          comments: ''
        }
      },
      tagList: {
        pageInfo: {},
        docs: []
      },
      addTag: {
        state: '',
        err: {}
      }
    },
    contentMessage: {
      formState: {
        show: false,
        edit: false,
        formData: {
          contentId: '',
          content: '',
          author: '',
          replyId: '',
          relationMsgId: ''
        },
        parentformData: {
          contentId: '',
          content: '',
          author: '',
          replyId: '',
          relationMsgId: ''
        }
      },
      messageList: {
        pageInfo: {},
        docs: []
      },
      addMessage: {
        state: '',
        err: {}
      }
    },
    regUser: {
      formState: {
        show: false,
        edit: false,
        formData: {
          name: '',
          userName: '',
          group: '',
          email: '',
          comments: '',
          phoneNum: '',
          enable: true,
          integral: 0
        }
      },
      userList: {
        pageInfo: {},
        docs: []
      }
    },
    bakDataList: {
      pageInfo: {},
      docs: []
    },
    systemOptionLogs: {
      pageInfo: {},
      docs: []
    },
    systemNotify: {
      pageInfo: {},
      docs: []
    },
    systemAnnounce: {
      pageInfo: {},
      docs: []
    },
    announceFormState: {
      title: '',
      content: ''
    },
    ads: {
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
          width: '',
          height: '',
          alt: '',
          sImg: ''
        }
      }
    },
    basicInfo: {
      adminUserCount: 0,
      regUserCount: 0,
      contentCount: 0,
      messageCount: 0
    }
  },
  mutations: {
    TOGGLE_SIDEBAR: state => {
      if (state.sidebar.opened) {
        Cookies.set('sidebarStatus', 1)
      } else {
        Cookies.set('sidebarStatus', 0)
      }
      state.sidebar.opened = !state.sidebar.opened
      state.sidebar.withoutAnimation = false
    },
    CLOSE_SIDEBAR: (state, withoutAnimation) => {
      Cookies.set('sidebarStatus', 1)
      state.sidebar.opened = false
      state.sidebar.withoutAnimation = withoutAnimation
    },
    TOGGLE_DEVICE: (state, device) => {
      state.device = device
    },
    SET_LANGUAGE: (state, language) => {
      state.language = language
      Cookies.set('language', language)
    },
    SET_SIZE: (state, size) => {
      state.size = size
      Cookies.set('size', size)
    },
    [types.INCREMENT](state) {
      state.count++
    },
    [types.DECREMENT](state) {
      state.count--
    },
    [types.ADMING_LOGINSTATE](state, params) {
      state.loginState = Object.assign({
        userInfo: {
          userName: '',
          email: '',
          logo: '',
          group: []
        },
        state: false
      }, {
          userInfo: params.userInfo,
          state: params.loginState || false,
          noticeCounts: params.noticeCounts
        });
    },
    [types.ADMINUSERFORMSTATE](state, formState) {
      state.adminUser.formState.show = formState.show;
      state.adminUser.formState.edit = formState.edit;
      if (!_.isEmpty(formState.formData)) {
        state.adminUser.formState.formData = formState.formData
      } else {
        state.adminUser.formState.formData = {
          name: '',
          userName: '',
          password: '',
          confirmPassword: '',
          group: '',
          email: '',
          comments: '',
          phoneNum: ''
        }
      }

    },
    [types.ADMINUSERLIST](state, userlist) {
      state.adminUser.userList = userlist
    },
    [types.ADMINGROUP_FORMSTATE](state, formState) {
      state.adminGroup.formState.show = formState.show;
      state.adminGroup.formState.edit = formState.edit;
      if (!_.isEmpty(formState.formData)) {
        state.adminGroup.formState.formData = formState.formData
      } else {
        state.adminGroup.formState.formData = {
          name: '',
          comments: '',
          enable: false
        }
      }

    },
    [types.ADMINGROUP_ROLEFORMSTATE](state, formState) {
      state.adminGroup.roleFormState.show = formState.show;
      state.adminGroup.roleFormState.edit = formState.edit;
      state.adminGroup.roleFormState.formData = Object.assign({
        name: '',
        comments: '',
        enable: false,
        power: []
      }, formState.formData);
    },
    [types.ADMINGROUP_LIST](state, rolelist) {
      state.adminGroup.roleList = rolelist
    },
    [types.ADMINRESOURCE_FORMSTATE](state, formState) {
      state.adminResource.formState.show = formState.show;
      state.adminResource.formState.edit = formState.edit;
      state.adminResource.formState.type = formState.type;
      state.adminResource.formState.formData = Object.assign({
        label: '',
        type: '',
        api: '',
        icon: '',
        routePath: '',
        componentPath: '',
        enable: true,
        parentId: '',
        sortId: 0,
        comments: '',
        parent: {
          id: '',
          label: ''
        }
      }, formState.formData);

    },
    [types.ADMINRESOURCE_LIST](state, resourceList) {
      state.adminResource.resourceList = resourceList
    },
    [types.ADMINTEMPLATE_LIST](state, templateList) {
      state.adminTemplate.templateList = templateList
    },
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
    [types.SYSTEMCONFIG_CONFIGLIST](state, config) {
      state.systemConfig.configs = Object.assign({
        siteName: '',
        siteDomain: '',
        siteDiscription: '',
        siteKeywords: '',
        siteEmailServer: '',
        siteEmail: '',
        siteEmailPwd: '',
        mongoDBPath: '',
        databackForderPath: '',
        poseArticlScore: '',
        postMessageScore: '',
        shareArticlScore: '',
        bakDataRate: '1',
        bakDatabyTime: false
      }, config)
    },
    [types.CONTENTCATEGORYS_FORMSTATE](state, formState) {
      state.contentCategory.formState.show = formState.show;
      state.contentCategory.formState.edit = formState.edit;
      state.contentCategory.formState.type = formState.type;
      state.contentCategory.formState.formData = Object.assign({
        name: '',
        enable: false,
        defaultUrl: '',
        parentId: '',
        parentObj: {},
        contentTemp: '',
        sortId: 0,
        comments: '',
        type: '1'
      }, formState.formData);

    },
    [types.CONTENTCATEGORYS_LIST](state, categoryList) {
      state.contentCategory.categoryList = categoryList
    },
    [types.CONTENT_FORMSTATE](state, formState) {
      state.content.formState.edit = formState.edit;
      state.content.formState.formData = Object.assign({
        title: '',
        stitle: '',
        type: '1',
        categories: [],
        sortPath: '',
        tags: [],
        keywords: '',
        sImg: '/upload/images/defaultImg.jpg',
        discription: '',
        author: {},
        uAuthor: '',
        markDownComments: '',
        state: true,
        isTop: 0,
        clickNum: 0,
        comments: '',
        commentNum: 0,
        likeNum: 0,
        likeUserIds: '',
        from: '1',
        postValue: 3,
        translate: '',
        twiterAuthor: ''
      }, formState.formData);

    },
    [types.CONTENT_LIST](state, contentList) {
      state.content.contentList = contentList
    },
    [types.CONTENT_ONE](state, content) {
      state.content.content = content
    },
    [types.CONTENTTAG_FORMSTATE](state, formState) {
      state.contentTag.formState.show = formState.show;
      state.contentTag.formState.edit = formState.edit;
      state.contentTag.formState.type = formState.type;
      state.contentTag.formState.formData = Object.assign({
        name: '',
        alias: '',
        comments: ''
      }, formState.formData);

    },
    [types.CONTENTTAG_LIST](state, tagList) {
      state.contentTag.tagList = tagList
    },
    [types.CONTENTMESSAGE_FORMSTATE](state, formState) {
      state.contentMessage.formState.show = formState.show;
      state.contentMessage.formState.edit = formState.edit;
      state.contentMessage.formState.type = formState.type;
      state.contentMessage.formState.formData = Object.assign({
        contentId: '',
        content: '',
        replyId: '',
        author: '',
        relationMsgId: ''
      }, formState.formData);
      state.contentMessage.formState.parentformData = Object.assign({
        contentId: '',
        content: '',
        replyId: '',
        author: '',
        relationMsgId: ''
      }, formState.parentformData);
    },
    [types.CONTENTMESSAGE_LIST](state, messageList) {
      state.contentMessage.messageList = messageList
    },
    [types.REGUSERFORMSTATE](state, formState) {
      state.regUser.formState.show = formState.show;
      state.regUser.formState.edit = formState.edit;

      state.regUser.formState.formData = Object.assign({
        name: '',
        userName: '',
        group: '',
        email: '',
        comments: '',
        phoneNum: '',
        enable: true
      }, formState.formData);

    },
    [types.REGUSERLIST](state, userlist) {
      state.regUser.userList = userlist
    },
    [types.BAKUPDATA_LIST](state, list) {
      state.bakDataList = list
    },
    [types.SYSTEMOPTIONLOGS_LIST](state, list) {
      state.systemOptionLogs = list
    },
    [types.SYSTEMNOTIFY_LIST](state, list) {
      state.systemNotify = list
    },
    [types.SYSTEMANNOUNCE_LIST](state, list) {
      state.systemAnnounce = list
    },
    [types.SYSTEMANNOUNCE_FORMSTATE](state, formState) {
      state.announceFormState = Object.assign({
        title: '',
        content: ''
      }, formState.formData);

    },
    [types.ADS_LIST](state, list) {
      state.ads.list = list
    },
    [types.ADS_INFO_FORMSTATE](state, formState) {
      state.ads.infoFormState.edit = formState.edit;
      state.ads.infoFormState.formData = Object.assign({
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
      state.ads.itemFormState.edit = formState.edit;
      state.ads.itemFormState.show = formState.show;
      state.ads.itemFormState.formData = Object.assign({
        title: '',
        link: '',
        width: '',
        height: '',
        alt: '',
        sImg: '',
      }, formState.formData);
    },
    [types.MAIN_SITEBASIC_INFO](state, list) {
      state.basicInfo = list
    }
  },
  actions: {
    toggleSideBar({ commit }) {
      commit('TOGGLE_SIDEBAR')
    },
    closeSideBar({ commit }, { withoutAnimation }) {
      commit('CLOSE_SIDEBAR', withoutAnimation)
    },
    toggleDevice({ commit }, device) {
      commit('TOGGLE_DEVICE', device)
    },
    setLanguage({ commit }, language) {
      commit('SET_LANGUAGE', language)
    },
    setSize({ commit }, size) {
      commit('SET_SIZE', size)
    },
    increment: ({
      commit
    }) => {
      console.log(commit);
      commit(types.INCREMENT);
    },
    decrement: ({
      commit
    }) => {
      console.log(commit);
      commit(types.DECREMENT);
    },
    handleOpen: ({
      commit
    }) => {
      console.log(commit);
    },
    handleClose: ({
      commit
    }) => {
      console.log(commit);
    },
    handleSelect: ({
      commit
    }) => {
      console.log(commit);
    },
    loginState: ({
      commit
    }, params = {
      userInfo: {},
      state: false
    }) => {
      services.getUserSession().then((result) => {
        commit(types.ADMING_LOGINSTATE, result.data.data)
      })
    },
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
      services.adminUserList(params).then((result) => {
        commit(types.ADMINUSERLIST, result.data.data)
      })
    },
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
      services.adminGroupList(params).then((result) => {
        commit(types.ADMINGROUP_LIST, result.data.data)
      })
    },
    showAdminResourceForm: ({
      commit
    }, params = {
      type: 'root',
      edit: false,
      formData: {}
    }) => {
      commit(types.ADMINRESOURCE_FORMSTATE, {
        show: true,
        type: params.type,
        edit: params.edit,
        formData: params.formData
      })
    },
    hideAdminResourceForm: ({
      commit
    }) => {
      commit(types.ADMINRESOURCE_FORMSTATE, {
        show: false
      })
    },
    getAdminResourceList({
      commit
    }, params = {}) {
      services.adminResourceList(params).then((result) => {
        let treeData = renderTreeData(result.data.data);
        commit(types.ADMINRESOURCE_LIST, treeData)
      })
    },
    getAdminTemplateList({
      commit
    }, params = {}) {
      services.adminTemplateList(params).then((result) => {
        let treeData = renderTreeData(result.data.data);
        commit(types.ADMINTEMPLATE_LIST, treeData)
      })
    },
    getMyTemplateList({
      commit
    }, params = {}) {
      services.getMyTemplateList(params).then((result) => {
        commit(types.MYTEMPLATE_LIST, result.data.data)
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
      services.getTemplateItemlist(params).then((result) => {
        commit(types.TEMPLATEITEMFORDER_LIST, result.data.data)
      })
    },
    getTempsFromShop({
      commit
    }, params = {}) {
      services.getTemplatelistfromShop(params).then((result) => {
        commit(types.DORACMSTEMPLATE_LIST, result.data.data)
      })
    },
    getSystemConfig({
      commit
    }, params = {}) {
      services.getSystemConfigs(params).then((config) => {
        let currentConfig = (config.data.data && config.data.data.docs) ? config.data.data.docs[0] : {};
        commit(types.SYSTEMCONFIG_CONFIGLIST, currentConfig)
      })
    },
    showContentCategoryForm: ({
      commit
    }, params = {
      type: 'root',
      edit: false,
      formData: {}
    }) => {
      commit(types.CONTENTCATEGORYS_FORMSTATE, {
        show: true,
        type: params.type,
        edit: params.edit,
        formData: params.formData
      })
    },
    hideContentCategoryForm: ({
      commit
    }) => {
      commit(types.CONTENTCATEGORYS_FORMSTATE, {
        show: false
      })
    },
    getContentCategoryList({
      commit
    }, params = {}) {
      services.contentCategoryList(params).then((result) => {
        let treeData = renderTreeData(result.data.data);
        commit(types.CONTENTCATEGORYS_LIST, treeData)
      })
    },

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
    getContentList({
      commit
    }, params = {}) {
      services.contentList(params).then((result) => {
        commit(types.CONTENT_LIST, result.data.data)
      })
    },

    getOneContent({
      commit
    }, params = {}) {
      services.contentInfo(params).then((result) => {
        commit(types.CONTENT_ONE, result.data.data)
      })
    },

    showContentTagForm: ({
      commit
    }, params = {
      edit: false,
      formData: {}
    }) => {
      commit(types.CONTENTTAG_FORMSTATE, {
        show: true,
        edit: params.edit,
        formData: params.formData
      })
    },
    hideContentTagForm: ({
      commit
    }) => {
      commit(types.CONTENTTAG_FORMSTATE, {
        show: false
      })
    },
    getContentTagList({
      commit
    }, params = {}) {
      services.contentTagList(params).then((result) => {
        commit(types.CONTENTTAG_LIST, result.data.data)
      })
    },
    showContentMessageForm: ({
      commit
    }, params = {
      edit: false,
      formData: {},
      parentformData: {}
    }) => {
      commit(types.CONTENTMESSAGE_FORMSTATE, {
        show: true,
        edit: params.edit,
        formData: params.formData,
        parentformData: params.parentformData
      })
    },
    hideContentMessageForm: ({
      commit
    }) => {
      commit(types.CONTENTMESSAGE_FORMSTATE, {
        show: false
      })
    },
    getContentMessageList({
      commit
    }, params = {}) {
      services.contentMessageList(params).then((result) => {
        commit(types.CONTENTMESSAGE_LIST, result.data.data)
      })
    },
    showRegUserForm: ({
      commit
    }, params = {
      edit: false,
      formData: {}
    }) => {
      commit(types.REGUSERFORMSTATE, {
        show: true,
        edit: params.edit,
        formData: params.formData
      })
    },
    hideRegUserForm: ({
      commit
    }) => {
      commit(types.REGUSERFORMSTATE, {
        show: false
      })
    },
    getRegUserList({
      commit
    }, params = {}) {
      services.regUserList(params).then((result) => {
        commit(types.REGUSERLIST, result.data.data)
      })
    },

    getBakDateList({
      commit
    }, params = {}) {
      services.getBakDataList(params).then((result) => {
        commit(types.BAKUPDATA_LIST, result.data.data)
      })
    },

    getSystemLogsList({
      commit
    }, params = {}) {
      services.getSystemOptionLogsList(params).then((result) => {
        commit(types.SYSTEMOPTIONLOGS_LIST, result.data.data)
      })
    },
    getSystemNotifyList({
      commit
    }, params = {}) {
      services.getSystemNotifyList(params).then((result) => {
        commit(types.SYSTEMNOTIFY_LIST, result.data.data)
      })
    },
    getSystemAnnounceList({
      commit
    }, params = {}) {
      services.getSystemAnnounceList(params).then((result) => {
        commit(types.SYSTEMANNOUNCE_LIST, result.data.data)
      })
    },
    showSysAnnounceForm: ({
      commit
    }, params = {}) => {
      commit(types.SYSTEMANNOUNCE_FORMSTATE, {
        formData: params
      })
    },
    getAdsList({
      commit
    }, params = {}) {
      services.getAdsList(params).then((result) => {
        commit(types.ADS_LIST, result.data.data)
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
    getSiteBasicInfo({
      commit
    }, params = {}) {
      services.getSiteBasicInfo(params).then((result) => {
        commit(types.MAIN_SITEBASIC_INFO, result.data.data)
      })
    }
  }
}

export default app
