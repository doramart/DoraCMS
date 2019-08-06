import Axios from "axios";
import _ from "lodash";
const {
    server_admin_api
} = require("~server/configs/urlConfigs");

const defaultConfig = {
    showLoading: true
}

export function reqJsonData(url, params = {}, method = 'post') {

    _.assign(params, defaultConfig);
    if (method === 'get') {
        return Axios.get(server_admin_api + '/' + url, {
            params
        })
    } else if (method === 'post') {
        return Axios.post(server_admin_api + '/' + url, params)
    }
}
export default {

    logOut() {
        return reqJsonData('manage/logout', {}, 'get')
    },

    getUserSession() {
        return reqJsonData('manage/getUserSession', {}, 'get')
    },

    getSiteBasicInfo(params) {
        return reqJsonData('manage/getSitBasicInfo', params, 'get')
    },

    adminUserList(params) {
        return reqJsonData('manage/adminUser/getList', params, 'get')
    },

    getOneAdminUser(params) {
        return reqJsonData('manage/adminUser/getOne', params, 'get')
    },

    addAdminUser(params) {
        return reqJsonData('manage/adminUser/addOne', params)
    },

    updateAdminUser(params) {
        return reqJsonData('manage/adminUser/updateOne', params)
    },

    deleteAdminUser(params) {
        return reqJsonData('manage/adminUser/deleteUser', params, 'get')
    },

    adminGroupList(params) {
        return reqJsonData('manage/adminGroup/getList', params, 'get')
    },

    getOneAdminGroup(params) {
        return reqJsonData('manage/adminGroup/getOne', params, 'get')
    },

    addAdminGroup(params) {
        return reqJsonData('manage/adminGroup/addOne', params)
    },

    updateAdminGroup(params) {
        return reqJsonData('manage/adminGroup/updateOne', params)
    },

    deleteAdminGroup(params) {
        return reqJsonData('manage/adminGroup/deleteGroup', params, 'get')
    },

    adminResourceList(params) {
        return reqJsonData('manage/adminResource/getList', params, 'get')
    },

    getOneAdminResource(params) {
        return reqJsonData('manage/adminResource/getOne', params, 'get')
    },

    addAdminResource(params) {
        return reqJsonData('manage/adminResource/addOne', params)
    },

    updateAdminResource(params) {
        return reqJsonData('manage/adminResource/updateOne', params)
    },

    deleteAdminResource(params) {
        return reqJsonData('manage/adminResource/deleteResource', params, 'get')
    },

    adminTemplateList(params) {
        return reqJsonData('manage/template/getTemplateForderList', params, 'get')
    },

    getTemplateFileInfo(params) {
        return reqJsonData('manage/template/getTemplateFileText', params, 'get')
    },

    updateTemplateFileText(params) {
        return reqJsonData('manage/template/updateTemplateFileText', params)
    },

    getMyTemplateList(params) {
        return reqJsonData('manage/template/getMyTemplateList', params, 'get')
    },

    addTemplateItem(params) {
        return reqJsonData('manage/template/addTemplateItem', params)
    },

    delTemplateItem(params) {
        return reqJsonData('manage/template/delTemplateItem', params, 'get')
    },

    getTemplateItemlist(params) {
        return reqJsonData('manage/template/getTemplateItemlist', params, 'get')
    },

    getTemplatelistfromShop(params) {
        return reqJsonData('manage/template/getTempsFromShop', params, 'get')
    },

    installTemp(params) {
        return reqJsonData('manage/template/installTemp', params, 'get')
    },

    enableTemp(params) {
        return reqJsonData('manage/template/enableTemp', params, 'get')
    },

    uninstallTemp(params) {
        return reqJsonData('manage/template/uninstallTemp', params, 'get')
    },

    getSystemConfigs(params) {
        return reqJsonData('manage/systemConfig/getConfig', params, 'get')
    },

    updateSystemConfigs(params) {
        return reqJsonData('manage/systemConfig/updateConfig', params)
    },

    contentCategoryList(params) {
        return reqJsonData('manage/contentCategory/getList', params, 'get')
    },

    getOneContentCategory(params) {
        return reqJsonData('manage/contentCategory/getOne', params, 'get')
    },

    addContentCategory(params) {
        return reqJsonData('manage/contentCategory/addOne', params)
    },

    updateContentCategory(params) {
        return reqJsonData('manage/contentCategory/updateOne', params)
    },

    deleteContentCategory(params) {
        return reqJsonData('manage/contentCategory/deleteCategory', params, 'get')
    },

    redictContentToUsers(params) {
        return reqJsonData('manage/content/redictContentToUsers', params)
    },

    contentList(params) {
        return reqJsonData('manage/content/getList', params, 'get')
    },

    getOneContent(params) {
        return reqJsonData('manage/content/getContent', params, 'get')
    },

    addContent(params) {
        return reqJsonData('manage/content/addOne', params)
    },

    updateContent(params) {
        return reqJsonData('manage/content/updateOne', params)
    },

    updateContentToTop(params) {
        return reqJsonData('manage/content/topContent', params)
    },

    roofContent(params) {
        return reqJsonData('manage/content/roofContent', params)
    },

    deleteContent(params) {
        return reqJsonData('manage/content/deleteContent', params, 'get')
    },

    getRandomContentImg(params) {
        return reqJsonData('api/v0/content/getRandomContentImg', params, 'get')
    },

    contentTagList(params) {
        return reqJsonData('manage/contentTag/getList', params, 'get')
    },

    getOneContentTag(params) {
        return reqJsonData('manage/contentTag/getOne', params, 'get')
    },

    addContentTag(params) {
        return reqJsonData('manage/contentTag/addOne', params)
    },

    updateContentTag(params) {
        return reqJsonData('manage/contentTag/updateOne', params)
    },

    deleteContentTag(params) {
        return reqJsonData('manage/contentTag/deleteTag', params, 'get')
    },

    contentMessageList(params) {
        return reqJsonData('manage/contentMessage/getList', params, 'get')
    },

    getOneContentMessage(params) {
        return reqJsonData('manage/contentMessage/getOne', params, 'get')
    },

    addContentMessage(params) {
        return reqJsonData('manage/contentMessage/addOne', params)
    },

    deleteContentMessage(params) {
        return reqJsonData('manage/contentMessage/deleteMessage', params, 'get')
    },

    regUserList(params) {
        return reqJsonData('manage/regUser/getList', params, 'get')
    },

    getOneRegUser(params) {
        return reqJsonData('manage/regUser/getOne', params, 'get')
    },

    updateRegUser(params) {
        return reqJsonData('manage/regUser/updateOne', params)
    },

    deleteRegUser(params) {
        return reqJsonData('manage/regUser/deleteUser', params, 'get')
    },

    getBakDataList(params) {
        return reqJsonData('manage/backupDataManage/getBakList', params, 'get')
    },

    bakUpData() {
        return reqJsonData('manage/backupDataManage/backUp', {})
    },

    deletetBakDataItem(params) {
        return reqJsonData('manage/backupDataManage/deleteDataItem', params, 'get')
    },

    getSystemOptionLogsList(params) {
        return reqJsonData('manage/systemOptionLog/getList', params, 'get')
    },

    deleteSystemOptionLogs(params) {
        return reqJsonData('manage/systemOptionLog/deleteLogItem', params, 'get')
    },

    clearSystemOptionLogs(params) {
        return reqJsonData('manage/systemOptionLog/deleteAllLogItem', params, 'get')
    },

    getSystemNotifyList(params) {
        return reqJsonData('manage/systemNotify/getList', params, 'get')
    },

    deleteSystemNotify(params) {
        return reqJsonData('manage/systemNotify/deleteNotifyItem', params, 'get')
    },

    setNoticeRead(params) {
        return reqJsonData('manage/systemNotify/setHasRead', params, 'get')
    },

    getSystemAnnounceList(params) {
        return reqJsonData('manage/systemAnnounce/getList', params, 'get')
    },

    deleteSystemAnnounce(params) {
        return reqJsonData('manage/systemAnnounce/deleteItem', params, 'get')
    },

    addSystemAnnounce(params) {
        return reqJsonData('manage/systemAnnounce/addOne', params)
    },

    getAdsList(params) {
        return reqJsonData('manage/ads/getList', params, 'get')
    },

    getOneAd(params) {
        return reqJsonData('manage/ads/getOne', params, 'get')
    },

    addOneAd(params) {
        return reqJsonData('manage/ads/addOne', params)
    },

    updateAds(params) {
        return reqJsonData('manage/ads/updateOne', params)
    },

    delAds(params) {
        return reqJsonData('manage/ads/delete', params, 'get')
    },

    siteMessageList(params) {
        return reqJsonData('manage/siteMessage/getList', params, 'get')
    },

    addSiteMessage(params) {
        return reqJsonData('manage/siteMessage/addOne', params)
    },

    updateSiteMessage(params) {
        return reqJsonData('manage/siteMessage/updateOne', params)
    },

    deleteSiteMessage(params) {
        return reqJsonData('manage/siteMessage/delete', params, 'get')
    },

    helpCenterList(params) {
        return reqJsonData('manage/helpCenter/getList', params, 'get')
    },

    getOneHelpCenter(params) {
        return reqJsonData('manage/helpCenter/getOne', params, 'get')
    },

    addHelpCenter(params) {
        return reqJsonData('manage/helpCenter/addOne', params)
    },

    updateHelpCenter(params) {
        return reqJsonData('manage/helpCenter/updateOne', params)
    },

    deleteHelpCenter(params) {
        return reqJsonData('manage/helpCenter/delete', params, 'get')
    },

    versionManageList(params) {
        return reqJsonData('manage/versionManage/getList', params, 'get')
    },

    addVersionManage(params) {
        return reqJsonData('manage/versionManage/addOne', params)
    },

    updateVersionManage(params) {
        return reqJsonData('manage/versionManage/updateOne', params)
    },

    deleteVersionManage(params) {
        return reqJsonData('manage/versionManage/delete', params, 'get')
    },

    //StoreAppServiceEnd





























}