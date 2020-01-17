const Controller = require('egg').Controller;
const _ = require('lodash');
const shortid = require('shortid');
const pkg = require('@root/package.json')
const validator = require('validator')
const captcha = require('trek-captcha')
const path = require('path')
const fs = require('fs')
const qr = require('qr-image')
const moment = require('moment')

class HomeController extends Controller {

    // 获取页面基础信息
    async getSiteInfo(ctx, appConfig) {
        let configs = await ctx.helper.reqJsonData('systemConfig/getConfig');
        const {
            siteName,
            siteDiscription,
            siteKeywords,
            siteAltKeywords,
            ogTitle,
        } = configs || [];

        let {
            title,
            des,
            keywords
        } = ctx.params;
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
            lang: ctx.session.locale,
            router: ctx.originalUrl.split('/')[1]
        }

    }

    async getImgCode(ctx, app) {

        const {
            token,
            buffer
        } = await captcha();
        ctx.session.imageCode = token;
        ctx.set('Content-Type', 'image/png');
        ctx.status = 200;
        ctx.body = buffer;
    }

    async createQRCode(ctx, app) {
        var text = ctx.request.query.text || "";
        if (text) {
            let img = qr.image(text, {
                size: 10
            });
            ctx.set('Content-Type', 'image/png');
            ctx.status = 200;
            ctx.body = img;
        } else {
            throw new Error(ctx.__('validate_error_params'));
        }
    }

    async getRobotsPage(ctx) {
        let stream = fs.readFileSync(path.join(__dirname, '../../../robots.txt'), 'utf-8');
        ctx.body = stream;
    }

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
    }

    async getSiteMapPage() {
        // 获取站点配置
        let configs = await this.ctx.helper.reqJsonData('systemConfig/getConfig');
        let root_path = configs.siteDomain;
        let priority = 0.8;
        let freq = "weekly";
        let lastMod = moment().format("YYYY-MM-DD");
        let xml =
            '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        xml += "<url>";
        xml += "<loc>" + root_path + "</loc>";
        xml += "<changefreq>daily</changefreq>";
        xml += "<lastmod>" + lastMod + "</lastmod>";
        xml += "<priority>" + 1 + "</priority>";
        xml += "</url>";

        // 类别地图
        let allCategories = await this.ctx.helper.reqJsonData('contentCategory/getList');
        allCategories.forEach(function (cate) {
            xml += "<url>";
            xml +=
                "<loc>" +
                root_path +
                "/" +
                cate.defaultUrl +
                "___" +
                cate._id +
                "</loc>";
            xml += "<changefreq>weekly</changefreq>";
            xml += "<lastmod>" + lastMod + "</lastmod>";
            xml += "<priority>0.8</priority>";
            xml += "</url>";
        });

        // 文档地图
        let allContents = await this.ctx.helper.reqJsonData('content/getList', {
            isPaging: '0'
        });
        allContents.forEach(function (post) {
            xml += "<url>";
            xml += "<loc>" + root_path + "/details/" + post._id + ".html</loc>";
            xml += "<changefreq>weekly</changefreq>";
            xml += "<lastmod>" + lastMod + "</lastmod>";
            xml += "<priority>0.5</priority>";
            xml += "</url>";
        });
        xml += "</urlset>";
        this.ctx.body = xml;
    }

    async getDataForIndexPage() {
        const ctx = this.ctx;
        ctx.query.current = ctx.params.current;
        ctx.tempPage = 'index.html';
        ctx.pageType = "index"
        await this.getPageData(this);
    }

    async getDataForCatePage() {
        const ctx = this.ctx;
        ctx.pageType = "cate"
        let typeId = ctx.params.typeId;
        let current = ctx.params.current;
        if (typeId) {
            if (!shortid.isValid(typeId)) {
                ctx.redirect("/");
            } else {
                if (current) {
                    if (validator.isNumeric(current)) {
                        await this.getPageData(this);
                    } else {
                        ctx.redirect("/");
                    }
                } else {
                    await this.getPageData(this);
                }
            }
        } else {
            ctx.redirect("/");
        }
    }

    async getDataForSearchPage() {
        const ctx = this.ctx;
        ctx.pageType = "search"
        let searchkey = ctx.params.searchkey;
        let current = ctx.params.current;
        if (searchkey) {
            if (current) {
                if (validator.isNumeric(current)) {
                    await this.getPageData(this);
                } else {
                    ctx.redirect("/");
                }
            } else {
                await this.getPageData(this);
            }
        } else {
            ctx.redirect("/");
        }
    }

    async getDataForTagPage() {
        const ctx = this.ctx;
        ctx.pageType = "tag";
        let tagName = ctx.params.tagName;
        let current = ctx.params.current;
        if (tagName) {
            if (current) {
                if (validator.isNumeric(current)) {
                    await this.getPageData(this);
                } else {
                    ctx.redirect("/");
                }
            } else {
                await this.getPageData(this);
            }
        } else {
            ctx.redirect("/");
        }
    }

    async getDataForContentDetails() {
        const ctx = this.ctx;
        let contentId = ctx.params.id;
        if (contentId) {
            if (!shortid.isValid(contentId)) {
                ctx.redirect("/");
            } else {
                ctx.pageType = "detail"
                await this.getPageData(this);
            }
        } else {
            ctx.redirect("/");
        }
    }

    async getDataForSiteMap() {
        const ctx = this.ctx;
        ctx.tempPage = 'sitemap.html';
        ctx.pageType = "sitemap"
        await this.getPageData(this);
    }

    async getDataForErr() {
        const ctx = this.ctx;
        ctx.tempPage = 'public/do' + ctx.errNo + '.html';
        ctx.modules = [{
            action: 'get_error_info_' + ctx.errNo
        }];
        await this.getPageData(this);
    }

    async getDataForUserLogin() {
        const ctx = this.ctx;
        if (ctx.session.user) {
            ctx.redirect("/");
        } else {
            ctx.title = '用户登录';
            ctx.tempPage = 'users/userLogin.html';
            await this.getPageData(this);
        }
    }

    async getDataForUserReg() {
        const ctx = this.ctx;
        if (ctx.session.user) {
            ctx.redirect("/");
        } else {
            ctx.title = '用户注册';
            ctx.tempPage = 'users/userReg.html';
            await this.getPageData(this);
        }
    }

    async getDataForResetPsdPage() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/userConfirmEmail.html';
        await this.getPageData(this);
    }

    async getDataForUserIndex() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/userCenter.html';
        await this.getPageData(this);
    }

    async getDataForUserCenter() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/userContents.html';
        await this.getPageData(this);
    }

    async getDataForJoinComments() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/joinComments.html';
        await this.getPageData(this);
    }

    async getDataForUserNotify() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/notify.html';
        await this.getPageData(this);
    }

    async getDataForUserAddContent() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/userAddContent.html';
        await this.getPageData(this);
    }

    async getDataForUserInfo() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/personInfo.html';
        await this.getPageData(this);
    }

    async getDataForSetUserPwd() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/userSetPsd.html';
        await this.getPageData(this);
    }

    async getDataForEditContent() {
        const ctx = this.ctx;
        let contentId = ctx.params.id;
        if (!shortid.isValid(contentId)) {
            ctx.redirect("/users/userCenter");
        } else {
            let contentInfo = await ctx.helper.reqJsonData('content/getContent', {
                id: contentId,
                userId: ctx.session.user._id,
                token: ctx.session.user.token
            });
            if (!_.isEmpty(contentInfo)) {
                ctx.tempPage = 'users/userAddContent.html';
                ctx.pageType = 'editContent';
                ctx.title = "编辑创作";
                ctx.contentId = contentId;
                await this.getPageData(this);
            } else {
                ctx.redirect("/users/userCenter");
            }
        }
    }

    async getDataForUserReply() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/userReplies.html';
        ctx.pageType = 'replies'
        await this.getPageData(this);
    }

    async getDataForUserNotice() {
        const ctx = this.ctx;
        ctx.tempPage = 'users/userNotice.html';
        ctx.pageType = 'notifies'
        await this.getPageData(this);
    }

    async getDataForPhoneCategory() {
        const ctx = this.ctx;
        ctx.tempPage = 'mb/phone-fenlei.html';
        ctx.pageType = 'phone_fenlei'
        await this.getPageData(this);
    }

    async getDataForPhoneList() {
        const ctx = this.ctx;
        ctx.tempPage = 'mb/phone-list.html';
        ctx.pageType = 'phone_list'
        await this.getPageData(this);
    }

    async getDataForPhoneUser() {
        const ctx = this.ctx;
        ctx.tempPage = 'mb/phone-user.html';
        ctx.pageType = 'phone_list'
        await this.getPageData(this);
    }

    async getPageData(that) {
        let {
            ctx
        } = that;
        let payload = ctx.params;
        let pageData = {
            pageType: ctx.pageType
        };

        let targetTempPage = ctx.tempPage;
        // 获取当前模板信息
        let defaultTemp = await ctx.helper.reqJsonData('contentTemplate/getDefaultTempInfo');

        // 获取用户信息
        if (ctx.session.logined) {
            pageData.userInfo = ctx.session.user;
            pageData.logined = ctx.session.logined;
        }
        // 静态目录
        if (!_.isEmpty(defaultTemp)) {
            pageData.staticforder = defaultTemp.alias;
        } else {
            throw new Error(ctx.__('validate_error_params'));
        }

        // 所有页面都需要的基础数据
        pageData.cateTypes = await ctx.helper.reqJsonData('contentCategory/getList', payload);
        pageData.siteInfo = await this.getSiteInfo(ctx);
        pageData.staticRootPath = that.app.config.static.prefix

        // 针对分类页和内容详情页动态添加meta
        let defaultTempItems = defaultTemp.items;
        if (!_.isEmpty(pageData.siteInfo)) {
            let siteDomain = pageData.siteInfo.configs.siteDomain;
            let ogUrl = siteDomain;
            let ogImg = siteDomain + "/public/themes/" + defaultTemp.alias + "/images/mobile_logo2.jpeg"

            if (ctx.pageType == 'index') { // 首页
                pageData.documentList = await ctx.helper.reqJsonData('content/getList', payload);
            } else if (ctx.pageType == 'cate') { // 分类列表

                if (payload.typeId) {
                    // 获取指定类别下的子类列表
                    pageData.currentCateList = await ctx.helper.reqJsonData('contentCategory/getCurrentCategoriesById', {
                        typeId: payload.typeId
                    });
                    // 获取当前分类的基本信息
                    pageData.cateInfo = await ctx.helper.reqJsonData('contentCategory/getOne', {
                        id: payload.typeId
                    });
                }

                if (!_.isEmpty(pageData.cateInfo)) {
                    let {
                        defaultUrl,
                        _id,
                        contentTemp
                    } = pageData.cateInfo;
                    ogUrl = siteDomain + '/' + defaultUrl + '___' + _id;
                    targetTempPage = this.getCateOrDetailTemp(defaultTempItems, contentTemp, 'cate');
                }
                let cateName = _.isEmpty(pageData.cateInfo) ? '' : (' | ' + pageData.cateInfo.name);
                pageData.siteInfo.title = pageData.siteInfo.title + cateName;
                // 获取分类文档列表
                pageData.documentList = await ctx.helper.reqJsonData('content/getList', payload);

            } else if (ctx.pageType == 'detail') { // 文档详情
                pageData.documentInfo = await ctx.helper.reqJsonData('content/getContent', {
                    id: payload.id
                })
                if (!_.isEmpty(pageData.documentInfo)) {
                    // 更改文档meta
                    pageData.siteInfo.title = pageData.documentInfo.title + ' | ' + pageData.siteInfo.title;
                    pageData.siteInfo.discription = pageData.documentInfo.discription;
                    // 获取文档所属类别下的分类列表
                    pageData.currentCateList = await ctx.helper.reqJsonData('contentCategory/getCurrentCategoriesById', {
                        contentId: pageData.documentInfo._id
                    });
                    ogUrl = siteDomain + '/details/' + pageData.documentInfo._id + '.html';
                    if (pageData.documentInfo.sImg && (pageData.documentInfo.sImg).indexOf('defaultImg.jpg') < 0) {
                        ogImg = siteDomain + pageData.documentInfo.sImg;
                    }
                    let parentCateTemp = pageData.documentInfo.categories[0].contentTemp;
                    targetTempPage = this.getCateOrDetailTemp(defaultTempItems, parentCateTemp, 'detail');
                } else {
                    throw new Error(ctx.__('label_page_no_power_content'));
                }
            } else if (ctx.pageType == 'sitemap') { // 站点地图
                let siteMapParams = _.assign({}, payload, {
                    isPaging: '0'
                });
                pageData.siteMapList = await ctx.helper.reqJsonData('content/getList', siteMapParams);
            } else if (ctx.pageType == 'editContent') { // 文档编辑
                if (ctx.contentId) {
                    pageData.contentId = ctx.contentId;
                }
            } else if (ctx.pageType == 'search') { // 关键词搜索
                targetTempPage = this.getCateOrDetailTemp(defaultTempItems, '', 'cate');
                payload.searchkey && (pageData.targetSearchKey = payload.searchkey);
                pageData.documentList = await ctx.helper.reqJsonData('content/getList', payload);
            } else if (ctx.pageType == 'tag') { // 标签所属
                targetTempPage = this.getCateOrDetailTemp(defaultTempItems, '', 'cate');
                payload.tagName && (pageData.targetTagName = payload.tagName);
                pageData.documentList = await ctx.helper.reqJsonData('content/getList', payload);
            }
            pageData.ogData = {
                url: ogUrl,
                img: ogImg
            };
        }

        let targetLocalJson = require('@root/config/locale/zh-CN.json')
        // 记录针对组件的国际化信息
        let sysKeys = {};
        for (let lockey in targetLocalJson) {
            if (lockey.indexOf('_layer_') > 0 || lockey.indexOf('label_system_') >= 0 || lockey.indexOf('label_uploader_') >= 0) {
                sysKeys[lockey] = ctx.__(lockey);
            }
        }

        // console.log('-------', ctx.isIOS);
        pageData.lsk = JSON.stringify(sysKeys);
        await ctx.render(defaultTemp.alias + '/' + targetTempPage, pageData);
    }

}

module.exports = HomeController;