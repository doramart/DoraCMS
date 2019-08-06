/**
 * Created by Administrator on 2015/5/30.
 */

const settings = require('@configs/settings');
let currentCache = settings.openRedis ? 'cache' : 'memoryCache';

const _ = require('lodash');
const moment = require('moment');
const cache = require('./' + currentCache)
const logUtil = require('./logUtil')


let hadCacheLaguage = false;

var siteFunc = {

    randomString(len, charSet) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz, randomPoz + 1);
        }
        return randomString;
    },
    setConfirmPassWordEmailTemp: function (res, sysConfigs, name, token) {

        let siteTitle = sysConfigs.siteName;
        var html = '<p>' + res.__("label_sendActiveEmail_text1") + '：' + name + '</p><br/>' +
            '<p>' + res.__("label_sendActiveEmail_text2") + '</p><br/>' +
            '<p><strong>' + siteTitle + '</strong> ' + res.__("label_sendActiveEmail_text2_1") + '</p><br/><br/>' +
            '<p>' + res.__("label_sendActiveEmail_text3") + '</p><br/>' +
            '<a href="' + sysConfigs.siteDomain + '/api/v0/user/reset_pass?key=' + token + '">' + res.__("label_sendActiveEmail_text4") + '</a><br/>' +
            '<a href="' + sysConfigs.siteDomain + '/api/v0/user/reset_pass?key=' + token + '">' + sysConfigs.siteDomain + '/api/v0/user/reset_pass?key=' + token + '</a><br/>' +
            '<p> <strong>' + siteTitle + ' </strong> </p>';
        return html;
    },

    setNoticeToAdminEmailTemp: function (res, sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var msgDate = moment(obj.date).format('YYYY-MM-DD HH:mm:ss');
        var html = '';
        html += '主人您好，<strong>' + obj.author.userName + '</strong> 于 ' + msgDate + ' 在 <strong>' + siteTitle + '</strong> 的文章 <a href="' + sysConfigs.siteDomain + '/details/' + obj.content._id + '.html">' + obj.content.title + '</a> 中留言了';
        return html;
    },

    setNoticeToAdminEmailByContactUsTemp: function (res, sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var msgDate = moment(obj.date).format('YYYY-MM-DD HH:mm:ss');
        var html = '';
        html += res.__("lc_sendEmail_user_notice_title") + '<br/><br/>' +
            res.__("lc_sendEmail_user_success_notice") + '<br/><br/>' +
            res.__("lc_sendEmail_user_notice_Info") + '<br/><br/>' +
            '<strong>' + res.__("label_user_email") + ': </strong>' + obj.email + '<br/><br/>' +
            '<strong>' + res.__("label_user_phoneNum") + ': </strong>' + obj.phoneNum + '<br/><br/>' +
            '<strong>' + res.__("lc_sendEmail_user_content") + ': </strong><br/><br/>' + obj.comments + '<br/><br/>'
        return html;
    },

    setNoticeToUserByContactUsTemp: function (res, sysConfigs, obj) {
        var html = '';
        html += res.__("label_sendActiveEmail_text1") + '，<strong>' + obj.name + '</strong>' + res.__("lc_sendEmail_user_success_notice") + '<br/><br/>';
        return html;
    },

    setNoticeToUserEmailTemp: function (res, sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var msgDate = moment(obj.date).format('YYYY-MM-DD HH:mm:ss');
        var html = '';
        var targetEmail;
        if (obj.author) {
            targetEmail = obj.author.userName;
        } else if (obj.adminAuthor) {
            targetEmail = obj.adminAuthor.userName;
        }
        html += '主人您好，<strong>' + targetEmail + '</strong> 于 ' + msgDate + ' 在 <strong>' + siteTitle + '</strong> 的文章 <a href="' + sysConfigs.siteDomain + '/details/' + obj.content._id + '.html">' + obj.content.title + '</a> 中回复了您';
        return html;
    },

    setBugToAdminEmailTemp: function (res, sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var msgDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        var html = '';
        html += '主人您好，测试管理员（' + obj.email + ')于 ' + msgDate + ' 在 <strong>' + siteTitle + '</strong> 的后台模块 <strong>' + obj.contentFrom + '</strong> 中说：<br>' + obj.content;
        return html;
    },

    setNoticeToUserRegSuccess: function (res, sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var html = '';
        html += obj.userName + ' （' + obj.email + ') ' + res.__("label_sendRegEmail_text1") + '<br><br>' +
            '<p>' + siteTitle + ' ' + res.__("label_sendRegEmail_text3") + '</p><br>' +
            '<p>' + res.__("label_sendRegEmail_text2") + ' ' + res.__("label_sendRegEmail_text4") + ' <a href="' + sysConfigs.siteDomain + '/users/login" target="_blank">' + res.__("label_sendRegEmail_text5") + '</a></p><br><br>';
        return html;
    },

    setNoticeToUserGetMessageCode: function (res, sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var html = '';
        html += obj.email + ' ' + res.__("label_sendRegEmail_text1") + '<br><br>' +
            '<p>' + res.__("label_sendRegEmail_text6") + '</p><br>' +
            '<p style="font-size:22px;font-weight:bold;">' + obj.renderCode + '</p><br><br>';
        return html;
    },

    getNoticeConfig: function (type, value) {
        var noticeObj;
        if (type == 'reg') {
            noticeObj = {
                type: '2',
                systemSender: 'doraCMS',
                title: '用户注册提醒',
                content: '新增注册用户 ' + value,
                action: type
            };
        } else if (type == 'msg') {
            noticeObj = {
                type: '2',
                sender: value.author,
                title: '用户留言提醒',
                content: '用户 ' + value.author.userName + ' 给您留言啦！',
                action: type
            };
        }
        return noticeObj;
    },


    renderNoPowerMenus(manageCates, adminPower) {
        let newResources = [],
            newRootCates = [];
        let rootCates = _.filter(manageCates, (doc) => {
            return doc.parentId == '0';
        });
        let menuCates = _.filter(manageCates, (doc) => {
            return doc.type == '0' && doc.parentId != '0';
        });
        let optionCates = _.filter(manageCates, (doc) => {
            return doc.type != '0';
        });
        if (!_.isEmpty(adminPower)) {
            // 是否显示子菜单
            for (let i = 0; i < menuCates.length; i++) {
                let resourceObj = JSON.parse(JSON.stringify(menuCates[i]));
                let cateFlag = this.checkNoAllPower(resourceObj._id, optionCates, adminPower);
                if (!cateFlag) {
                    newResources.push(resourceObj);
                }
            }
            // 是否显示大类菜单
            for (const cate of rootCates) {
                let fiterSubCates = _.filter(newResources, (doc) => {
                    return doc.parentId == cate._id;
                });
                if (fiterSubCates.length != 0) {
                    newRootCates.push(cate);
                }
            }
        }
        return newResources.concat(newRootCates);
    },

    // 子菜单都无权限校验
    checkNoAllPower(resourceId, childCates, power) {
        let cateFlag = true;
        let rootCates = _.filter(childCates, (doc) => {
            return doc.parentId == resourceId
        });
        for (const cate of rootCates) {
            if ((power).indexOf(cate._id) > -1) {
                cateFlag = false;
                break;
            }
        }
        return cateFlag;
    },


    getSiteLocalKeys(local = 'zh-CN', res) {
        return new Promise((resolve, reject) => {
            if (!hadCacheLaguage) {
                console.log('begin clear redis session');
                cache.del(settings.session_secret + '_localkeys_zh-TW');
                cache.del(settings.session_secret + '_localkeys_zh-CN');
                hadCacheLaguage = true;
            }
            cache.get(settings.session_secret + '_localkeys_' + local, async (localRenderData) => {
                if (!_.isEmpty(localRenderData)) {
                    console.log('use old language cache:', settings.session_secret + '_localkeys_' + local)
                    resolve(localRenderData)
                } else {
                    let targetLocalJson = require(`../../locales/${local}.json`);
                    let renderKeys = {};
                    // 记录针对组件的国际化信息
                    let sysKeys = {};
                    for (let lockey in targetLocalJson) {
                        renderKeys[lockey] = targetLocalJson[lockey];
                        if (lockey.indexOf('_layer_') > 0 || lockey.indexOf('label_system_') >= 0 || lockey.indexOf('label_uploader_') >= 0) {
                            sysKeys[lockey] = targetLocalJson[lockey];
                        }
                    }
                    console.log('language had cache:', settings.session_secret + '_localkeys_' + local)
                    cache.set(settings.session_secret + '_localkeys_' + local, {
                        renderKeys,
                        sysKeys
                    }, 1000 * 60 * 60 * 24);
                    resolve({
                        renderKeys,
                        sysKeys
                    })
                }
            })
        })
    },

    getStrLength(str) {
        let charCode = -1;
        const len = str.length;
        let realLength = 0;
        let zhChar = 0,
            enChar = 0;
        for (let i = 0; i < len; i++) {
            charCode = str.charCodeAt(i)
            if (charCode >= 0 && charCode <= 128) {
                realLength += 1;
                enChar++
            } else {
                realLength += 2;
                zhChar++
            }
        }
        return {
            length: realLength,
            enChar,
            zhChar
        }
    },

    setTempParentId(arr, key) {
        for (var i = 0; i < arr.length; i++) {
            var pathObj = arr[i];
            pathObj.parentId = key;
        }
        return arr;
    },

    getTempBaseFile: function (path) {
        var thisType = (path).split('.')[1];
        var basePath;
        if (thisType == 'html') {
            basePath = process.cwd() + '/views/';
        } else if (thisType == 'json') {
            basePath = process.cwd();
        } else {
            basePath = process.cwd() + '/public/themes/';
        }
        return basePath;
    },

    // 扫描某路径下文件夹是否存在
    checkExistFile(tempFilelist, forderArr) {

        let filterForderArr = [],
            distPath = false;
        for (let i = 0; i < forderArr.length; i++) {
            const forder = forderArr[i];
            let currentForder = _.filter(tempFilelist, (fileObj) => {
                return fileObj.name == forder;
            })
            filterForderArr = filterForderArr.concat(currentForder);
        }
        if (filterForderArr.length > 0 && (tempFilelist.length >= forderArr.length) && (filterForderArr.length == tempFilelist.length)) {
            distPath = true;
        }

        return distPath;
    },

    // 初始化设置来源，针对 get 有效
    setUserClient(req, res, next) {
        // 这里设置白名单跨域
        if (req.query.token) {
            req.query.useClient = '2'; // 移动端
        } else {
            req.query.useClient = '1'; // PC端
        }
        next();
    },

    //筛选内容中的url
    getAHref(htmlStr, type = 'image') {
        var reg = /<img.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
        if (type == 'video') {
            reg = /<video.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
        } else if (type == 'audio') {
            reg = /<audio.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
        }
        var arr = [];
        while (tem = reg.exec(htmlStr)) {
            arr.push(tem[2]);
        }
        return arr;
    },
    renderSimpleContent(htmlStr, imgLinkArr, videoLinkArr) {
        // console.log('----imgLinkArr-', imgLinkArr);
        let renderStr = [];
        // 去除a标签
        htmlStr = htmlStr.replace(/(<\/?a.*?>)|(<\/?span.*?>)/g, '');
        htmlStr = htmlStr.replace(/(<\/?br.*?>)/g, '\n\n');
        if (imgLinkArr.length > 0 || videoLinkArr.length > 0) {
            // console.log('----1111---')
            let delImgStr, delEndStr;
            var imgReg = /<img[^>]*>/gim;
            var videoReg = /<video[^>]*>/gim;
            if (imgLinkArr.length > 0) {
                delImgStr = htmlStr.replace(imgReg, "|I|");
            } else {
                delImgStr = htmlStr;
            }
            if (videoLinkArr.length > 0) {
                delEndStr = delImgStr.replace(videoReg, "|V|");
            } else {
                delEndStr = delImgStr;
            }
            // console.log('--delEndStr--', delEndStr);
            let imgArr = delEndStr.split("|I|");
            let imgTag = 0,
                videoTag = 0;
            for (let i = 0; i < imgArr.length; i++) {
                const imgItem = imgArr[i];
                // console.log('---imgItem---', imgItem);
                if (imgItem.indexOf("|V|") < 0) {
                    // console.log('----i----', imgItem);
                    imgItem && renderStr.push({
                        type: 'contents',
                        content: imgItem
                    })
                    if (imgLinkArr[imgTag]) {
                        renderStr.push({
                            type: 'image',
                            content: imgLinkArr[imgTag]
                        });
                        imgTag++;
                    }
                } else { // 包含视频片段
                    let smVideoArr = imgItem.split('|V|');
                    for (let j = 0; j < smVideoArr.length; j++) {
                        const smVideoItem = smVideoArr[j];
                        smVideoItem && renderStr.push({
                            type: 'contents',
                            content: smVideoItem
                        })
                        if (videoLinkArr[videoTag]) {
                            let videoImg = siteFunc.getVideoImgByLink(videoLinkArr[videoTag])
                            renderStr.push({
                                type: 'video',
                                content: videoLinkArr[videoTag],
                                videoImg
                            });
                            videoTag++;
                        }
                    }
                    if (imgLinkArr[imgTag]) {
                        renderStr.push({
                            type: 'image',
                            content: imgLinkArr[imgTag]
                        });
                        imgTag++;
                    }
                }
            }
        } else {

            renderStr.push({
                type: 'contents',
                content: htmlStr
            })
        }

        return JSON.stringify(renderStr);
    },

    checkContentType(htmlStr, type = 'content') {
        let imgArr = this.getAHref(htmlStr, 'image');
        let videoArr = this.getAHref(htmlStr, 'video');
        let audioArr = this.getAHref(htmlStr, 'audio');

        let defaultType = '0',
            targetFileName = '';
        if (videoArr && videoArr.length > 0) {
            defaultType = '3';
            targetFileName = videoArr[0];
        } else if (audioArr && audioArr.length > 0) {
            defaultType = '4';
            targetFileName = audioArr[0];
        } else if (imgArr && imgArr.length > 0) {
            // 针对帖子有两种 大图 小图
            if (type == 'content') {
                defaultType = (Math.floor(Math.random() * 2) + 1).toString();
            } else if (type == 'class') {
                defaultType = '1';
            }
            targetFileName = imgArr[0];
        } else {
            defaultType = '1';
        }
        let renderLink = targetFileName;
        if (type == '3') {
            // 视频缩略图
            renderLink = siteFunc.getVideoImgByLink(targetFileName);
        }
        return {
            type: defaultType,
            defaultUrl: renderLink,
            imgArr,
            videoArr
        };
    },
    getVideoImgByLink(link) {
        let oldFileType = link.replace(/^.+\./, '')
        return link.replace('.' + oldFileType, '.jpg');
    },

    clearUserSensitiveInformation(targetObj) {
        targetObj.password && delete targetObj.password;
        targetObj.countryCode && delete targetObj.countryCode;
        targetObj.phoneNum && delete targetObj.phoneNum;
        targetObj.email && delete targetObj.email;
        targetObj.watchSpecials && delete targetObj.watchSpecials;
        targetObj.watchCommunity && delete targetObj.watchCommunity;
        targetObj.praiseCommunityContent && delete targetObj.praiseCommunityContent;
        targetObj.praiseMessages && delete targetObj.praiseMessages;
        targetObj.praiseContents && delete targetObj.praiseContents;
        targetObj.favoriteCommunityContent && delete targetObj.favoriteCommunityContent;
        targetObj.favorites && delete targetObj.favorites;
        targetObj.despiseCommunityContent && delete targetObj.despiseCommunityContent;
        targetObj.despiseMessage && delete targetObj.despiseMessage;
        targetObj.despises && delete targetObj.despises;
        targetObj.watchers && delete targetObj.watchers;
        targetObj.followers && delete targetObj.followers;
    },

    // 跳转到提示页面
    async directToErrorPage(req, res, next) {
        try {
            let noticeTempPath = process.cwd() + '/views/' + req.query.errorTemp + '/users/userNotice.html';
            let localKeys = await this.getSiteLocalKeys(req.session.locale, res);
            let renderData = {
                pageType: "notice",
                infoType: "warning",
                infoContent: req.query.message || '',
                staticforder: req.query.errorTemp,
                lk: localKeys.renderKeys
            }
            res.render(noticeTempPath, renderData);
        } catch (error) {
            logUtil.error(error, req);
            next();
        }
    },

    sendTellMessagesByPhoneNum() {
        console.log('待实现');
    },


    // OPTION_DATABASE_BEGIN
    async addSiteMessage(type = '', activeUser = '', passiveUser = '', content = '', params = {
        targetMediaType: '0',
        recordId: ''
    }) {

        try {
            const messageObj = {
                type,
                activeUser: activeUser._id,
                passiveUser,
                recordId: params.recordId,
                isRead: false
            }

            if (params.targetMediaType == '0') {
                messageObj.content = content;
            } else if (params.targetMediaType == '1') {
                messageObj.message = content;
            } else if (params.targetMediaType == '2') {
                messageObj.communityContent = content;
            } else if (params.targetMediaType == '3') {
                messageObj.communityMessage = content;
            }

            const {
                siteMessageService
            } = require('@service');
            await siteMessageService.create(messageObj);

        } catch (error) {
            logUtil.error(error, {});
        }
    },


    // OPTION_DATABASE_END
};
module.exports = siteFunc;