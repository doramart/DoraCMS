/**
 ** 定义获取前端数据入口
* 
 */
// [documentList] 约定获取文档列表
const mainCtrl = require('./mainCtrl');


let generalFun = {

    async getDataForIndexPage(req, res, next) {
        req.query.tempPage = 'index.html';
        req.query.modules = [
            { action: 'get_document_list', params: { current: req.query.current } },
            { action: 'get_document_rec_list' },
            { action: 'get_document_hot_list' },
            { action: 'get_category_list' },
            { action: 'get_site_ads_list' },
            { action: 'get_new_message_list' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForCatePage(req, res, next) {
        req.query.modules = [
            { action: 'get_category_list' },
            { action: 'get_site_ads_list' },
            { action: 'get_category_list_byContentId' },
            { action: 'get_document_list', params: { current: req.query.current } },
            { action: 'get_document_hot_list' },
            { action: 'get_document_rec_list' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForContentDetails(req, res, next) {
        req.query.modules = [
            { action: 'get_category_list' },
            { action: 'get_category_list_byContentId', params: { contentId: req.params.id } },
            { action: 'get_content_detail' },
            { action: 'get_random_content' },
            { action: 'get_document_new_list' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForSiteMap(req, res, next) {
        req.query.tempPage = 'sitemap.html';
        req.query.modules = [
            { action: 'get_sitemap_list', params: { contentfiles: 'title' } },
            { action: 'get_category_list' },
            { action: 'get_site_info', params: { modal: 'simple', title: '站点地图' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForErr() {
        req.query.tempPage = 'public/do' + req.query.errNo + '.html';
        req.query.modules = [
            { action: 'get_error_info_' + req.query.errNo }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForUserLoginAndReg(req, res, next) {
        req.query.modules = [
            { action: 'get_category_list' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForResetPsdPage(req, res, next) {
        req.query.tempPage = 'users/userConfirmEmail.html';
        req.query.modules = [
            { action: 'get_category_list' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForUserCenter(req, res, next) {
        req.query.modules = [
            { action: 'get_category_list' },
            { action: 'get_tag_list' },
            { action: 'get_document_new_list' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForUserReply(req, res, next) {
        req.query.tempPage = 'users/userReplies.html';
        req.query.modules = [
            { action: 'get_user_replies_list', params: { user: req.session.user._id } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForUserNotice(req, res, next) {
        req.query.tempPage = 'users/userNotice.html';
        req.query.modules = [
            { action: 'get_user_notice_list', params: { user: req.session.user._id } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForAdminUserLogin(req, res, next) {
        req.query.tempPage = 'adminUserLogin.html';
        req.query.modules = [
            { action: 'get_category_list' },
            { action: 'get_adminlogin_Info' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForIcoInfoList(req, res, next) {
        req.query.modules = [
            { action: 'get_ico_info_list' },
            { action: 'get_category_list' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForIcoDetails(req, res, next) {
        req.query.modules = [
            { action: 'get_ico_details' },
            { action: 'get_category_list' },
            { action: 'get_site_info', params: { modal: 'simple' } }
        ];
        await mainCtrl.getPageData(req, res, next);
    },

}



module.exports = generalFun;