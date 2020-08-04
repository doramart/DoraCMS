'use strict';
const _ = require('lodash');
const fs = require('fs');
const pkg = require('../../package.json')

module.exports = {

    async getSiteInfo() {
        let ctx = this;
        // console.log('--ctx.originalUrl--', ctx.originalUrl)
        let configs = await ctx.helper.reqJsonData('systemConfig/getConfig');
        const {
            siteName,
            siteDiscription,
            siteKeywords,
            siteAltKeywords,
            ogTitle,
            siteLogo,
            siteDomain
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
            logo: siteLogo,
            url: siteDomain,
            ogTitle,
            discription,
            key,
            altkey,
            configs: configs || [],
            version: pkg.version,
            lang: ctx.session.locale,
            router: ctx.originalUrl.split('/')[1]
        }

    },

    renderCateName(pageData) {

        let pageType = pageData.pageType;
        let title = '';
        if (pageType == 'search') {
            title = `搜索：${pageData.targetSearchKey}`
        } else if (pageType == 'tag') {
            title = `标签：${pageData.targetTagName}`
        } else {
            title = !_.isEmpty(pageData.cateInfo) ? pageData.cateInfo.name : '推荐';
        }

        pageData['list_title'] = title;
    },

    // 获取类别或文档详情模板文件
    getCateOrDetailTemp(defaultTemp, contentTemp = '', type) {
        let fileName = "contentList.html",
            currentPath = "";
        if (type == 'detail') {
            fileName = "detail.html";
        }
        if (!_.isEmpty(contentTemp)) {
            currentPath = contentTemp.forder + "/" + fileName;
        } else {
            let defaultItem = _.filter(defaultTemp.items, (temp) => {
                return temp.isDefault;
            })
            currentPath = defaultItem[0].forder + "/" + fileName;
        }
        // 校验模板的真实路径
        let themePath = this.app.config.temp_view_forder + defaultTemp.alias + '/';
        // console.log('--current--', current)
        if (fs.existsSync(themePath + currentPath)) {
            return currentPath;
        } else {
            // 兼容根目录下的模板方案
            if (type == 'cate' && fs.existsSync(themePath + 'page.html')) {
                return 'page.html';
            } else if (type == 'detail' && fs.existsSync(themePath + 'post.html')) {
                console.log('---get post-')
                return 'post.html';
            } else if (type == 'author' && fs.existsSync(themePath + 'author.html')) {
                return 'author.html';
            } else {
                throw new Error('please add template first!');
            }
        }
    },

    async getPageData() {

        let ctx = this;
        let payload = ctx.params;
        let pageData = {
            pageType: ctx.pageType
        };

        // console.log('--payload--', payload)
        // console.log('--pageData--', pageData)

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
        pageData.navigation = await ctx.helper.reqJsonData('contentCategory/getList', payload);
        pageData.site = await this.getSiteInfo();
        pageData.staticRootPath = this.app.config.static.prefix;
        pageData.staticThemePath = this.app.config.static.prefix + '/themes/' + defaultTemp.alias;

        // 针对分类页和内容详情页动态添加meta
        // let defaultTempItems = defaultTemp.items;
        if (!_.isEmpty(pageData.site)) {
            let siteDomain = pageData.site.configs.siteDomain;
            let ogUrl = siteDomain;
            let ogImg = `${siteDomain}${this.app.config.static.prefix}/themes/${defaultTemp.alias}/images/mobile_logo2.jpeg`;

            if (ctx.pageType == 'index') { // 首页
                let {
                    docs,
                    pageInfo
                } = await ctx.helper.reqJsonData('content/getList', payload);
                pageData.posts = docs;
                pageData.pageInfo = pageInfo;
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
                    targetTempPage = this.getCateOrDetailTemp(defaultTemp, contentTemp, 'cate');
                }
                let cateName = _.isEmpty(pageData.cateInfo) ? '' : (' | ' + pageData.cateInfo.name);
                pageData.site.title = pageData.site.title + cateName;
                // 获取分类文档列表
                let {
                    docs,
                    pageInfo
                } = await ctx.helper.reqJsonData('content/getList', payload);
                pageData.posts = docs;
                pageData.pageInfo = pageInfo;

            } else if (ctx.pageType == 'detail') { // 文档详情
                pageData.post = await ctx.helper.reqJsonData('content/getContent', {
                    id: payload.id
                })
                if (!_.isEmpty(pageData.post)) {
                    // 更改文档meta
                    pageData.site.title = pageData.post.title + ' | ' + pageData.site.title;
                    pageData.site.discription = pageData.post.discription;
                    // 获取文档所属类别下的分类列表
                    pageData.currentCateList = await ctx.helper.reqJsonData('contentCategory/getCurrentCategoriesById', {
                        contentId: pageData.post._id
                    });
                    ogUrl = siteDomain + pageData.post.url;
                    if (pageData.post.sImg && (pageData.post.sImg).indexOf('defaultImg.jpg') < 0) {
                        ogImg = siteDomain + pageData.post.sImg;
                    }
                    let parentCateTemp = pageData.post.categories[0].contentTemp;
                    targetTempPage = this.getCateOrDetailTemp(defaultTemp, parentCateTemp, 'detail');
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
                targetTempPage = this.getCateOrDetailTemp(defaultTemp, '', 'cate');
                payload.searchkey && (pageData.targetSearchKey = payload.searchkey);
                let {
                    docs,
                    pageInfo
                } = await ctx.helper.reqJsonData('content/getList', payload);
                pageData.posts = docs;
                pageData.pageInfo = pageInfo;
            } else if (ctx.pageType == 'tag') { // 标签所属
                targetTempPage = this.getCateOrDetailTemp(defaultTemp, '', 'cate');
                payload.tagName && (pageData.targetTagName = payload.tagName);
                let {
                    docs,
                    pageInfo
                } = await ctx.helper.reqJsonData('content/getList', payload);
                pageData.posts = docs;
                pageData.pageInfo = pageInfo;
            } else if (ctx.pageType == 'author') { // 作者主页
                targetTempPage = this.getCateOrDetailTemp(defaultTemp, '', 'author');
                let {
                    docs,
                    pageInfo,
                    author
                } = await ctx.helper.reqJsonData('content/getList', payload);
                pageData.posts = docs;
                pageData.pageInfo = pageInfo;
                pageData.author = author;
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

        // 获取分类标题
        this.renderCateName(pageData);

        // console.log('----ctx.hooks.---', ctx.locals['HOOK@documentDetailAfter']);
        pageData.lsk = JSON.stringify(sysKeys);
        if (targetTempPage.indexOf('users/') == '0') {
            pageData.themePublicPath = `../${defaultTemp.alias}/default.html`;
            console.log('--pageData.themePublicPath--', pageData.themePublicPath)
            await ctx.render(targetTempPage, pageData);
        } else {
            await ctx.render(defaultTemp.alias + '/' + targetTempPage, pageData);
        }
    }




};