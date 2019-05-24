/**
 ** 定义获取前端数据入口
 * 
 */
// [documentList] 约定获取文档列表
const {
    AdminUser,
    AdminGroup,
    AdminResource,
    ContentCategory,
    Content,
    ContentTag,
    User,
    Message,
    SystemConfig,
    DataOptionLog,
    SystemOptionLog,
    UserNotify,
    Notify,
    Ads,
    ContentTemplate
} = require('../controller');
const settings = require("../../../configs/settings");
const logUtil = require("../../../utils/middleware/logUtil");
const siteFunc = require("../../../utils/siteFunc");
const _ = require('lodash');

let mainCtrl = {

    // 获取页面基础信息
    async getSiteInfo(req, res, next) {
        let configs = await SystemConfig.getSystemConfigs(req, res, next);
        const {
            siteName,
            siteDiscription,
            siteKeywords,
            siteAltKeywords,
            ogTitle
        } = configs[0] || [];

        let {
            title,
            des,
            keywords
        } = req.query;
        let pageTitle = title ? (title + ' | ' + siteName) : siteName;
        let discription = des ? des : siteDiscription;
        let key = keywords ? keywords : siteKeywords;
        let altkey = siteAltKeywords || '';
        return {
            title: pageTitle,
            ogTitle,
            discription,
            key,
            altkey,
            configs: configs[0] || [],
            version: 'v2.1.2',
            lang: req.session.locale,
        }
    },

    // 获取分类信息
    async getCategoryList(req, res, next) {
        req.query.enable = true;
        return await ContentCategory.getContentCategories(req, res, next);
    },

    // 获取单个分类信息
    async getCategoryInfoById(req, res, next) {
        return await ContentCategory.getCategoryInfoById(req, res, next);
    },

    // 获取文档获取当前父子类别信息
    async getCategoryByContentId(req, res, next) {
        return await ContentCategory.getCurrentCategoriesById(req, res, next);
    },

    // 获取文档列表
    async getDocumentList(req, res, next) {
        // !req.query.type && (req.query.type = '1');
        return await Content.getContents(req, res, next);
    },

    // 获取站点地图列表
    async getSiteMapList(req, res, next) {
        return await Content.getAllContens(req, res, next);
    },

    // 获取随机文档列表
    async getRandomDocumentList(req, res, next) {
        return await Content.getRadomContents(req, res, next);
    },

    // 获取单个文档
    async getOneDocument(req, res, next) {
        // req.query.state = '2';
        return await Content.getOneContent(req, res, next);
    },

    // 获取留言列表
    async getMessageList(req, res, next) {
        return await Message.getMessages(req, res, next);
    },

    // 获取用户消息
    async getUserNoticeList(req, res, next) {
        return await UserNotify.getUserNotifys(req, res, next);
    },

    // 获取用户列表
    async getUserList(req, res, next) {
        return await User.getUsers(req, res, next);
    },

    // 获取标签数据
    async getTagList(req, res, next) {
        return await ContentTag.getContentTags(req, res, next);
    },

    // 获取广告数据
    async getAdsList(req, res, next) {
        req.query.state = true;
        return await Ads.getAds(req, res, next);
    },

    // 获取当前模板信息
    async getCurrentTempInfo(req, res, next) {
        return await ContentTemplate.getCurrentTempInfo(req, res, next)
    },

    // 获取帮助内容
    async getHelpInfo(req, res, next) {
        if (req.params.lang == 'zh-TW') {
            req.query.helpLang = '3'
        }
        return await HelpCenter.getHelpCenters(req, res, next);
    },
    // 获取类别或文档详情模板文件
    getCateOrDetailTemp(defaultTempItems, contentTemp = '', type) {
        let fileName = "contentList.html",
            currentPath = "";
        if (type == 'detail') {
            fileName = "detail.html";
        }
        if (!_.isEmpty(contentTemp)) {
            currentPath = contentTemp.forder + "/" + fileName;
        } else {
            let defaultItem = _.filter(defaultTempItems, (temp) => {
                return temp.isDefault;
            })
            currentPath = defaultItem[0].forder + "/" + fileName;
        }
        return currentPath;
    },

    async getPageData(req, res, next) {

        let _this = this;
        req.query.useClient = '1'; // 标记来自pc端
        let pageData = {
                pageType: 'index'
            },
            modules = req.query.modules;

        try {
            for (let md of modules) {
                req.query = Object.assign({}, req.query, md.params);
                if (md.action.indexOf('get_document') > -1) {
                    let queryParams = {},
                        documentKey = 'documentList';
                    if (md.action == 'get_document_hot_list') {
                        queryParams = {
                            sortby: 'clickNum',
                            current: 1,
                            type: '1'
                        };
                        documentKey = 'hotItemListData';
                    } else if (md.action == 'get_document_new_list') {
                        queryParams = {
                            model: 'simple',
                            current: 1
                        };
                        documentKey = 'newItemListData';
                    } else if (md.action == 'get_document_rec_list') {
                        queryParams = {
                            isTop: 1,
                            current: 1
                        };
                        documentKey = 'reCommendListData';
                    }
                    Object.assign(req.query, queryParams);
                    req.query.state = '2';
                    pageData[documentKey] = await mainCtrl.getDocumentList(req, res, next);
                } else if (md.action == 'get_category_list') {
                    pageData.cateTypes = await mainCtrl.getCategoryList(req, res, next);
                } else if (md.action == 'get_category_list_byContentId') {
                    pageData.currentCateList = await mainCtrl.getCategoryByContentId(req, res, next);
                } else if (md.action == 'get_tag_list') {
                    pageData.tagList = await mainCtrl.getTagList(req, res, next);
                } else if (md.action == 'get_content_detail') {
                    pageData.pageType = 'detail';
                    let docInfo = await mainCtrl.getOneDocument(req, res, next);
                    // 查询不到文档
                    if (_.isEmpty(docInfo)) {
                        continue;
                    } else {
                        pageData.documentInfo = docInfo;
                        const {
                            title,
                            discription,
                            tags
                        } = pageData.documentInfo;
                        req.query.title = title;
                        req.query.des = discription;
                    }
                } else if (md.action == 'get_random_content') {
                    pageData.randomListData = await mainCtrl.getRandomDocumentList(req, res, next);
                } else if (md.action == 'get_content_messages') {
                    pageData.messageList = await mainCtrl.getMessageList(req, res, next);
                } else if (md.action == 'get_user_replies_list') {
                    pageData.pageType = 'replies';
                    pageData.replyMessageList = await mainCtrl.getMessageList(req, res, next);
                } else if (md.action == 'get_new_message_list') {
                    req.query.pageSize = 5;
                    pageData.newMessageList = await mainCtrl.getMessageList(req, res, next);
                } else if (md.action == 'get_user_notice_list') {
                    pageData.pageType = 'notifies';
                    pageData.userNoticeList = await mainCtrl.getUserNoticeList(req, res, next);
                } else if (md.action == 'get_sitemap_list') {
                    pageData.siteMapList = await mainCtrl.getSiteMapList(req, res, next);
                } else if (md.action == 'get_error_info_404' || md.action == 'get_error_info_500') {
                    pageData.pageType = 'error';
                    pageData.errInfo = req.query.message;
                } else if (md.action == 'get_site_info') {
                    pageData.siteInfo = await mainCtrl.getSiteInfo(req, res, next);
                } else if (md.action == 'get_site_ads_list') {
                    req.query.current = 1;
                    pageData.adsList = await mainCtrl.getAdsList(req, res, next);
                } else if (md.action == 'get_adminlogin_Info') {
                    pageData.pageType = 'adminlogin';
                }
            }

            let defaultTemp = await mainCtrl.getCurrentTempInfo(req, res, next);
            // 登录态
            // console.log('----req.session.user----', req.session.user)
            pageData.userInfo = req.session.user ? await User.getOneUserByParams({
                _id: req.session.user._id
            }) : {};
            pageData.logined = req.session.logined;
            // 静态目录
            pageData.staticforder = defaultTemp.data.alias;
            // 当前类别
            if (req.query.typeId) {
                pageData.cateInfo = await mainCtrl.getCategoryInfoById(req, res, next);
                if (req.query.isIndex) {
                    pageData.pageType = "index";
                    !_.isEmpty(pageData.siteInfo) && (pageData.siteInfo.title = pageData.siteInfo.title)
                } else {
                    pageData.pageType = "cate";
                    let cateName = _.isEmpty(pageData.cateInfo) ? '' : ('|' + pageData.cateInfo.name);
                    !_.isEmpty(pageData.siteInfo) && (pageData.siteInfo.title = pageData.siteInfo.title + cateName);
                }
            }

            if (req.query.searchkey) {
                pageData.pageType = "search";
                pageData.targetSearchKey = req.query.searchkey;
            }

            if (req.query.tagName) {
                pageData.pageType = "tag";
                pageData.targetTagName = req.query.tagName;
            }

            // 针对分类页和内容详情页动态添加meta
            let defaultTempItems = defaultTemp.data.items;
            if (!_.isEmpty(pageData.siteInfo)) {
                let siteDomain = pageData.siteInfo.configs.siteDomain;
                let ogUrl = siteDomain;
                let ogImg = siteDomain + "/themes/" + defaultTemp.data.alias + "/images/mobile_logo2.jpeg"
                if (pageData.pageType == 'cate') {
                    if (!_.isEmpty(pageData.cateInfo)) {
                        let {
                            defaultUrl,
                            _id,
                            contentTemp
                        } = pageData.cateInfo
                        ogUrl = siteDomain + '/' + defaultUrl + '___' + _id;
                        req.query.tempPage = mainCtrl.getCateOrDetailTemp(defaultTempItems, contentTemp, 'cate');
                    }
                } else if (pageData.pageType == 'search' || pageData.pageType == 'tag') {
                    req.query.tempPage = mainCtrl.getCateOrDetailTemp(defaultTempItems, '', 'cate');
                } else if (pageData.pageType == 'detail') {
                    if (!_.isEmpty(pageData.documentInfo)) {
                        ogUrl = siteDomain + '/details/' + pageData.documentInfo._id + '.html';
                        if (pageData.documentInfo.sImg && (pageData.documentInfo.sImg).indexOf('defaultImg.jpg') < 0) {
                            ogImg = siteDomain + pageData.documentInfo.sImg;
                        }
                        let parentCateTemp = pageData.documentInfo.categories[0].contentTemp;
                        req.query.tempPage = mainCtrl.getCateOrDetailTemp(defaultTempItems, parentCateTemp, 'detail');
                    } else {
                        throw new siteFunc.UserException(res.__('label_page_no_power_content'));
                    }
                }
                pageData.ogData = {
                    url: ogUrl,
                    img: ogImg
                };
            }

            // 读取国际化文件信息
            let localKeys = await siteFunc.getSiteLocalKeys(req.session.locale, res);
            pageData.lk = localKeys.renderKeys;
            pageData.lsk = JSON.stringify(localKeys.sysKeys);

            res.render(settings.SYSTEMTEMPFORDER + defaultTemp.data.alias + '/' + req.query.tempPage, pageData);
        } catch (error) {
            logUtil.error(error, req);
            if (error.message == '404' || error.message == '505') {
                next();
            } else {
                let defaultTemp = await mainCtrl.getCurrentTempInfo(req, res, next);
                req.query.message = error.message;
                req.query.errorTemp = defaultTemp.data.alias;
                await siteFunc.directToErrorPage(req, res, next);
            }
        }
    }

}



module.exports = mainCtrl;