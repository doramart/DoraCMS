/**
 * Created by Administrator on 2015/5/30.
 */

const settings = require("../configs/settings");
const shortid = require('shortid');
const _ = require('lodash');
const moment = require('moment');
const cache = require('./middleware/cache')
const logUtil = require('./middleware/logUtil')
const authToken = require('./middleware/token');
const {
    User,
    Content,
    SiteMessage,
    Message,
    AdminUser,
    SystemConfig,
} = require('../server/lib/models');
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
            '<a href="' + sysConfigs.siteDomain + '/users/reset_pass?key=' + token + '">' + res.__("label_sendActiveEmail_text4") + '</a><br/>' +
            '<a href="' + sysConfigs.siteDomain + '/users/reset_pass?key=' + token + '">' + sysConfigs.siteDomain + '/users/reset_pass?key=' + token + '</a><br/>' +
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
    // 校验合法ID
    checkCurrentId(ids) {
        if (!ids) return false;
        let idState = true;
        let idsArr = ids.split(',');
        if (typeof idsArr === "object" && idsArr.length > 0) {
            for (let i = 0; i < idsArr.length; i++) {
                if (!shortid.isValid(idsArr[i])) {
                    idState = false;
                    break;
                }
            }
        } else {
            idState = false;
        }
        return idState;
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

    // 异常捕获对象
    UserException: function (message) {
        this.message = message;
        this.name = "UserException";
    },


    // 封装api返回的数据
    renderApiData(req = {}, res, responseCode, responseMessage, data = {}, type = "") {

        if (type == 'getlist') {
            responseMessage = res.__("validate_error_getSuccess", {
                success: responseMessage
            })
        } else if (type == 'options') {
            responseMessage = res.__("sys_layer_option_success")
        }

        let sendData = {
            status: responseCode,
            message: responseMessage,
            server_time: (new Date()).getTime(),
            data
        }

        if ((type == "addDespise" || // 踩帖
                type == "addFavorite" || // 添加收藏
                type == "followMaster" || // 关注

                type == "addPraise" || // 点赞

                type == 'updateUserInfo' || // 更新用户信息
                type == 'addTags' || // 添加标签
                type == "postMessage") && req.session.user) {
            // 添加需要更新缓存的标记
            req.session.refreshTag = true
            return sendData;
        } else {
            return sendData;
        }
    },

    renderApiErr(req, res, responseCode, responseMessage, type = '') {
        if (typeof responseMessage == 'object') {
            responseMessage = responseMessage.message;
        }

        // 处理登录失效的回调
        if (responseMessage == res.__("label_notice_asklogin")) {
            responseCode = 401;
        }
        let errorData = {
            status: responseCode,
            message: responseMessage,
            server_time: (new Date()).getTime(),
            data: {}
        }
        // 记录错误日志
        logUtil.error(responseMessage, req);
        return errorData;
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
                    let targetLocalJson = require(`../locales/${local}.json`);
                    let renderKeys = {};
                    // 记录针对组件的国际化信息
                    let sysKeys = {};
                    for (let lockey in targetLocalJson) {
                        renderKeys[lockey] = targetLocalJson[lockey];
                        if (lockey.indexOf('_layer_') > 0 || lockey.indexOf('label_system_') >= 0 || lockey.indexOf('label_uploader_') >= 0) {
                            sysKeys[lockey] = targetLocalJson[lockey];
                        }
                    }
                    let timeSet = process.env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 : 1000;
                    console.log('language had cache:', settings.session_secret + '_localkeys_' + local)
                    cache.set(settings.session_secret + '_localkeys_' + local, {
                        renderKeys,
                        sysKeys
                    }, timeSet);
                    resolve({
                        renderKeys,
                        sysKeys
                    })
                }
            })
        })
    },
    renderLocalStr() {
        let str = [' ', '  '];
        if (settings.lang == 'en') {
            str = ['  ', '    ']
        }
        return str;
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
            basePath = settings.SYSTEMTEMPFORDER;
        } else if (thisType == 'json') {
            basePath = process.cwd();
        } else {
            basePath = settings.TEMPSTATICFOLDER;
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

    checkPostToken(req, res, token = '') {
        return new Promise(async (resolve, reject) => {
            if (req.query.authUser) {
                if (!token) { // PC 前端
                    // 管理员不需要鉴权
                    if (req.session.user && req.query.useClient == '1') {
                        console.log('request from web front');
                        resolve();
                    } else if (req.session.adminlogined && req.query.useClient == '0') {
                        console.log('request from web back');
                        resolve();
                    } else {
                        reject(res.__("label_notice_asklogin"))
                    }
                } else {
                    req.query.useClient = '2';
                    let checkToken = await authToken.checkToken(token);
                    if (checkToken) {
                        let targetUser = await User.findOne({
                            _id: checkToken.userId
                        });
                        if (!_.isEmpty(targetUser)) {
                            console.log('user had login, request from mobile');
                            req.session.user = targetUser;
                            resolve();
                        } else {
                            reject(res.__("label_notice_asklogin"))
                        }
                    } else {
                        reject(res.__("label_notice_asklogin"))
                    }
                }
            }
            resolve();
        })

    },
    getAuthUserFields(type = '') {
        let fieldStr = "id userName category group logo date enable";
        if (type == 'login') {
            fieldStr = "id userName category group logo date enable phoneNum countryCode email comments position loginActive birth password";
        } else if (type == 'base') {
            fieldStr = "id userName category group logo date enable phoneNum countryCode email watchers followers comments favorites favoriteCommunityContent despises comments profession experience industry introduction birth creativeRight gender";
        } else if (type == 'session') {
            fieldStr = "id userName category group logo date enable phoneNum countryCode email watchers followers praiseContents praiseMessages praiseCommunityContent watchSpecials watchCommunity watchTags favorites favoriteCommunityContent despises despiseMessage despiseCommunityContent comments position gender vip";
        }
        return fieldStr;
    },
    getContentListFields(useClient = '', type = '') {
        let files = null;
        if (useClient == '2') {
            files = '_id title stitle sImg uAuthor date discription type appShowType imageArr videoArr duration simpleComments videoImg state dismissReason'
        } else {
            if (type == 'normal') {
                files = '_id title stitle sImg uAuthor date updateDate discription type videoImg state dismissReason'
            } else if (type == 'simple') {
                files = '_id title stitle sImg stitle date updateDate type videoImg state dismissReason';
            }
        }
        // console.log('--files----', files)
        return files;
    },
    getDateStr(addDayCount) {
        var dd = new Date();
        dd.setDate(dd.getDate() + addDayCount); //获取AddDayCount天后的日期
        var y = dd.getFullYear();
        var m = (dd.getMonth() + 1) < 10 ? "0" + (dd.getMonth() + 1) : (dd.getMonth() + 1); //获取当前月份的日期，不足10补0
        var d = dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate(); //获取当前几号，不足10补0
        let endDate = moment().format("YYYY-MM-DD");
        return {
            startTime: y + "-" + m + "-" + d + ' 23:59:59',
            endTime: endDate + ' 23:59:59'
        }
    },
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

            const newSiteMessage = new SiteMessage(messageObj);
            await newSiteMessage.save();

        } catch (error) {
            logUtil.error(error, {});
        }
    },
    async getUserInfoByToken(req, next) {
        let currentToken = await authToken.checkToken(req.query.token);
        if (currentToken) {
            let targetUser = await User.findOne({
                _id: currentToken.userId
            }, siteFunc.getAuthUserFields('session'));
            if (!_.isEmpty(targetUser)) {
                console.log('user had login, request from ', req.query.useClient);
                req.session.user = targetUser;
            } else {
                console.log('user had no login, request from ', req.query.useClient);
            }
        }
        next();
    },
    async checkUserToken(req, res, next) {
        try {
            let userToken = req.query.token;
            if (!_.isEmpty(req.session.user) && !userToken) { // 针对web端
                // TODO 查询用户信息成本比较高，只在需要更新用户信息的地方重新查询数据
                if (req.session.refreshTag) {
                    req.session.user = await User.findOne({
                        _id: req.session.user._id
                    }, siteFunc.getAuthUserFields('session'));
                    req.session.refreshTag = false;
                    console.log('refresh session, request from ', req.query.useClient);
                } else {
                    console.log('user old session, request from ', req.query.useClient);
                }
                next();
            } else { // 针对非web端
                if (userToken) {
                    req.session.user = "";
                    let checkToken = await authToken.checkToken(req.query.token);
                    if (checkToken) {
                        let targetUser = await User.findOne({
                            _id: checkToken.userId
                        }, siteFunc.getAuthUserFields('session'));
                        if (!_.isEmpty(targetUser)) {
                            console.log('user had login,request from ', req.query.useClient);
                            req.session.user = targetUser;
                            next();
                        } else {
                            throw new siteFunc.UserException(res.__("label_notice_asklogin"));
                        }
                    } else {
                        throw new siteFunc.UserException(res.__("label_notice_asklogin"));
                    }
                } else {
                    throw new siteFunc.UserException(res.__("label_notice_asklogin"));
                }
            }
        } catch (error) {
            logUtil.error(error, req);
            res.send({
                status: 401,
                message: res.__("label_notice_asklogin")
            });
        }
    },
    // 针对前台api需要登录态校验
    checkUserSessionForApi(req, res, next) {
        if (req.method == 'GET') {
            siteFunc.checkUserToken(req, res, next);
        } else if (req.method == 'POST') {
            // 添加鉴权识别参数
            req.query.authUser = true;
            next();
        }
    },

    // 针对登录态非必须的状态校验(GET)
    async checkUserLoginState(req, res, next) {
        if (!_.isEmpty(req.session.user) && !(req.query.token)) {
            try {
                if (req.session.refreshTag) {
                    req.session.user = await User.findOne({
                        _id: req.session.user._id
                    }, siteFunc.getAuthUserFields('session'));
                    req.session.refreshTag = false;
                    console.log('refresh session, request from ', req.query.useClient);
                } else {
                    console.log('user old session, request from ', req.query.useClient);
                }
            } catch (error) {
                logUtil.error(error, req);
            }
            next();
        } else {
            if (req.query.token) {
                req.session.user = "";
                siteFunc.getUserInfoByToken(req, next);
            } else {
                next();
            }
        }
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
            // console.log('----2222---', renderStr)
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
    getCacheValueByKey(key) {
        return new Promise((resolve, reject) => {
            cache.get(key, (targetValue) => {
                if (targetValue) {
                    resolve(targetValue)
                } else {
                    resolve('');
                }
            })
        })
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
    clearRedisByType(str, cacheKey) {
        console.log('cacheStr', str);
        let currentKey = settings.session_secret + cacheKey + str;
        cache.set(currentKey, '', 2000);
    },
    // 跳转到提示页面
    async directToErrorPage(req, res, next) {
        try {
            let noticeTempPath = settings.SYSTEMTEMPFORDER + req.query.errorTemp + '/users/userNotice.html';
            let localKeys = await this.getSiteLocalKeys(req.session.locale, res);
            // console.log(noticeTempPath, '--localKeys--', localKeys)
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

};
module.exports = siteFunc;