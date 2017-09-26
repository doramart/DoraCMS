export default {
    count(state) {
        return state.count
    },
    loginState: state => state.loginState,
    adminUserFormState: state => state.adminUser.formState,
    adminUserList: state => state.adminUser.userList,
    adminGroupFormState: state => state.adminGroup.formState,
    adminGroupRoleFormState: state => state.adminGroup.roleFormState,
    adminGroupList: state => state.adminGroup.roleList,
    adminResourceFormState: state => state.adminResource.formState,
    adminResourceList: state => state.adminResource.resourceList,
    systemConfig: state => state.systemConfig,
    contentCategoryFormState: state => state.contentCategory.formState,
    contentCategoryList: state => state.contentCategory.categoryList,
    contentFormState: state => state.content.formState,
    contentList: state => state.content.contentList,
    contentTagFormState: state => state.contentTag.formState,
    contentTagList: state => state.contentTag.tagList,
    contentMessageFormState: state => state.contentMessage.formState,
    contentMessageList: state => state.contentMessage.messageList,
    regUserFormState: state => state.regUser.formState,
    regUserList: state => state.regUser.userList,
    bakDataList: state => state.bakDataList,
    systemOptionLogs: state => state.systemOptionLogs,
    systemNotify: state => state.systemNotify,
    systemAnnounce: state => state.systemAnnounce,
    systemAnnounceFormState: state => state.announceFormState,
    adsList: state => state.ads.list,
    adsInfoForm: state => state.ads.infoFormState,
    adsItemForm: state => state.ads.itemFormState,
    basicInfo: state => state.basicInfo

}