/**
 * Created by Administrator on 2015/5/30.
 */

const settings = require("./settings");
const shortid = require('shortid');
const _ = require('lodash');
const moment = require('moment');

var siteFunc = {

    setConfirmPassWordEmailTemp: function (sysConfigs, name, token) {

        let siteTitle = sysConfigs.siteName;
        var html = '<p>您好：' + name + '</p>' +
            '<p>我们收到您在 <strong>' + siteTitle + '</strong> 的注册信息，请点击下面的链接来激活帐户：</p>' +
            '<a href="' + sysConfigs.siteDomain + '/users/reset_pass?key=' + token + '">重置密码链接</a>' +
            '<p>若您没有在 <strong>' + siteTitle + '</strong> 填写过注册信息，说明有人滥用了您的电子邮箱，请忽略或删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
            '<p> <strong>' + siteTitle + ' </strong> 谨上。</p>';

        return html;

    },

    setNoticeToAdminEmailTemp: function (sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var msgDate = moment(obj.date).format('YYYY-MM-DD HH:mm:ss');
        var html = '';
        html += '主人您好，<strong>' + obj.author.userName + '</strong> 于 ' + msgDate + ' 在 <strong>' + siteTitle + '</strong> 的文章 <a href="' + sysConfigs.siteDomain + '/details/' + obj.content._id + '.html">' + obj.content.title + '</a> 中留言了';
        return html;
    },

    setNoticeToUserEmailTemp: function (sysConfigs, obj) {
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

    setBugToAdminEmailTemp: function (sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var msgDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        var html = '';
        html += '主人您好，测试管理员（' + obj.email + ')于 ' + msgDate + ' 在 <strong>' + siteTitle + '</strong> 的后台模块 <strong>' + obj.contentFrom + '</strong> 中说：<br>' + obj.content;
        return html;
    },

    setNoticeToUserRegSuccess: function (sysConfigs, obj) {
        let siteTitle = sysConfigs.siteName;
        var html = '';
        html += '亲爱的 ' + obj.userName + ' （' + obj.email + ') ，恭喜您成为 <strong>' + siteTitle + '</strong> 的新用户！ 您现在可以 <a href="' + sysConfigs.siteDomain + '/users/login" target="_blank">点击登录</a>';
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
        let newResources = [], newRootCates = [];
        let rootCates = _.filter(manageCates, (doc) => { return doc.parentId == '0'; });
        let menuCates = _.filter(manageCates, (doc) => { return doc.type == '0' && doc.parentId != '0'; });
        let optionCates = _.filter(manageCates, (doc) => { return doc.type != '0'; });
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
                let fiterSubCates = _.filter(newResources, (doc) => { return doc.parentId == cate._id; });
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
    }

};
module.exports = siteFunc;