import * as types from './types.js'
import getters from './getters';
import _ from 'lodash';
const state = {
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
            databackForderPath: ''
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
                parentObj: '',
                sortId: 0,
                comments: ''
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
                type: '',
                categories: [],
                sortPath: '',
                tags: [],
                keywords: '',
                sImg: '',
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
                from: '1'
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
                enable: true
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
}

const mutations = {
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
            databackForderPath: ''
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
            sortId: 0,
            comments: ''
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
            type: '',
            categories: [],
            sortPath: '',
            tags: [],
            keywords: '',
            sImg: '',
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
            from: '1'
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

}

export default {
    state,
    mutations,
    getters
}