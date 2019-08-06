/*
 * @Author: doramart 
 * @Date: 2019-07-13 01:01:46 
 * @Discription 定义获取前端数据入口
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-31 14:13:16
 */


const mainCtrl = require('./mainCtrl');

let generalFun = {

    async getDataForIndexPage(req, res, next) {
        req.query.tempPage = 'index.html';
        req.query.pageType = "index"
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForCatePage(req, res, next) {
        req.query.pageType = "cate"
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForSearchPage(req, res, next) {
        req.query.pageType = "search"
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForTagPage(req, res, next) {
        req.query.pageType = "tag"
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForContentDetails(req, res, next) {
        req.query.pageType = "detail"
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForSiteMap(req, res, next) {
        req.query.tempPage = 'sitemap.html';
        req.query.pageType = "sitemap"
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForErr() {
        req.query.tempPage = 'public/do' + req.query.errNo + '.html';
        req.query.modules = [{
            action: 'get_error_info_' + req.query.errNo
        }];
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForUserLoginAndReg(req, res, next) {
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForResetPsdPage(req, res, next) {
        req.query.tempPage = 'users/userConfirmEmail.html';
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForUserCenter(req, res, next) {
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForUserReply(req, res, next) {
        req.query.tempPage = 'users/userReplies.html';
        req.query.pageType = 'replies'
        await mainCtrl.getPageData(req, res, next);
    },

    async getDataForUserNotice(req, res, next) {
        req.query.tempPage = 'users/userNotice.html';
        req.query.pageType = 'notifies'
        await mainCtrl.getPageData(req, res, next);
    },

    // async getDataForAdminUserLogin(req, res, next) {
    //     req.query.tempPage = 'adminUserLogin.html';
    //     req.query.pageType = 'adminlogin';
    //     await mainCtrl.getPageData(req, res, next);
    // },


}



module.exports = generalFun;