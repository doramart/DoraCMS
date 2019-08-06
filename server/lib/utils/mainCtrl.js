/*
 * @Author: doramart 
 * @Date: 2019-07-21 14:31:38 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-02 14:18:49
 */


const settings = require('@configs/settings');
const {
    siteFunc,
    logUtil
} = require("@utils");
const _ = require('lodash');
const pkg = require('@root/package.json')

let mainCtrl = {

    // 获取页面基础信息
    async getSiteInfo(req, res, next) {
        try {
            let configs = await reqJsonData('systemConfig/getConfig');
            const {
                siteName,
                siteDiscription,
                siteKeywords,
                siteAltKeywords,
                ogTitle
            } = configs || [];

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
                configs: configs || [],
                version: pkg.version,
                lang: req.session.locale,
            }
        } catch (error) {
            return '';
        }
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

        let payload = req.query;
        let pageData = {
            pageType: payload.pageType
        };

        let targetTempPage = req.query.tempPage;
        // 获取当前模板信息
        let defaultTemp = await reqJsonData('contentTemplate/getDefaultTempInfo');
        try {
            // 获取用户信息
            if (req.session.logined) {
                pageData.userInfo = req.session.user;
                pageData.logined = req.session.logined;
            }
            // 静态目录
            if (!_.isEmpty(defaultTemp)) {
                pageData.staticforder = defaultTemp.alias;
            } else {
                throw new Error(res.__('validate_error_params'));
            }

            // 所有页面都需要的基础数据
            pageData.cateTypes = await reqJsonData('contentCategory/getList', payload);
            pageData.siteInfo = await this.getSiteInfo(req);

            // 针对分类页和内容详情页动态添加meta
            let defaultTempItems = defaultTemp.items;
            if (!_.isEmpty(pageData.siteInfo)) {
                let siteDomain = pageData.siteInfo.configs.siteDomain;
                let ogUrl = siteDomain;
                let ogImg = siteDomain + "/themes/" + defaultTemp.alias + "/images/mobile_logo2.jpeg"

                if (pageData.pageType == 'index') { // 首页
                    pageData.documentList = await reqJsonData('content/getList', payload);
                } else if (pageData.pageType == 'cate') { // 分类列表

                    if (payload.typeId) {
                        // 获取指定类别下的子类列表
                        pageData.currentCateList = await reqJsonData('contentCategory/getCurrentCategoriesById', {
                            typeId: payload.typeId
                        });
                        // 获取当前分类的基本信息
                        pageData.cateInfo = await reqJsonData('contentCategory/getOne', {
                            id: payload.typeId
                        });
                    }

                    if (!_.isEmpty(pageData.cateInfo)) {
                        let {
                            defaultUrl,
                            _id,
                            contentTemp
                        } = pageData.cateInfo
                        ogUrl = siteDomain + '/' + defaultUrl + '___' + _id;
                        targetTempPage = this.getCateOrDetailTemp(defaultTempItems, contentTemp, 'cate');
                    }
                    let cateName = _.isEmpty(pageData.cateInfo) ? '' : (' | ' + pageData.cateInfo.name);
                    pageData.siteInfo.title = pageData.siteInfo.title + cateName;
                    // 获取分类文档列表
                    pageData.documentList = await reqJsonData('content/getList', payload);

                } else if (pageData.pageType == 'detail') { // 文档详情
                    pageData.documentInfo = await reqJsonData('content/getContent', {
                        id: req.query.id
                    })
                    if (!_.isEmpty(pageData.documentInfo)) {
                        // 更改文档meta
                        pageData.siteInfo.title = pageData.documentInfo.title + ' | ' + pageData.siteInfo.title;
                        pageData.siteInfo.discription = pageData.documentInfo.discription;
                        // 获取文档所属类别下的分类列表
                        pageData.currentCateList = await reqJsonData('contentCategory/getCurrentCategoriesById', {
                            contentId: pageData.documentInfo._id
                        });
                        ogUrl = siteDomain + '/details/' + pageData.documentInfo._id + '.html';
                        if (pageData.documentInfo.sImg && (pageData.documentInfo.sImg).indexOf('defaultImg.jpg') < 0) {
                            ogImg = siteDomain + pageData.documentInfo.sImg;
                        }
                        let parentCateTemp = pageData.documentInfo.categories[0].contentTemp;
                        targetTempPage = this.getCateOrDetailTemp(defaultTempItems, parentCateTemp, 'detail');
                    } else {
                        throw new Error(res.__('label_page_no_power_content'));
                    }
                } else if (pageData.pageType == 'sitemap') { // 站点地图
                    let siteMapParams = _.assign({}, payload, {
                        isPaging: '0'
                    });
                    pageData.siteMapList = await reqJsonData('content/getList', siteMapParams);
                } else if (pageData.pageType == 'editContent') { // 文档编辑
                    if (req.query.contentId) {
                        pageData.contentId = req.query.contentId;
                    }
                } else if (pageData.pageType == 'search') { // 关键词搜索
                    targetTempPage = this.getCateOrDetailTemp(defaultTempItems, '', 'cate');
                    req.query.searchkey && (pageData.targetSearchKey = req.query.searchkey);
                    pageData.documentList = await reqJsonData('content/getList', payload);
                } else if (pageData.pageType == 'tag') { // 标签所属
                    targetTempPage = this.getCateOrDetailTemp(defaultTempItems, '', 'cate');
                    req.query.tagName && (pageData.targetTagName = req.query.tagName);
                    pageData.documentList = await reqJsonData('content/getList', payload);
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
            res.render(process.cwd() + '/views/' + defaultTemp.alias + '/' + targetTempPage, pageData);
        } catch (error) {
            logUtil.error(error, req);
            if (error.message == '404' || error.message == '505') {
                next();
            } else {
                if (!_.isEmpty(defaultTemp)) {
                    req.query.message = error.message;
                    req.query.errorTemp = defaultTemp.alias;
                    await siteFunc.directToErrorPage(req, res, next);
                } else {
                    next();
                }
            }
        }
    }

}


module.exports = mainCtrl;