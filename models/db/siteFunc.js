/**
 * Created by Administrator on 2015/5/30.
 */
// 文档对象
var Content = require("../Content");
//文章类别对象
var ContentCategory = require("../ContentCategory");
//文章标签对象
var ContentTags = require("../ContentTags");
//广告对象
var Ads = require("../Ads");
//留言对象
var Message = require("../Message");
var settings = require("./settings");
//数据库操作对象
var DbOpt = require("../Dbopt");
//时间格式化
var moment = require('moment');
//缓存
var cache = require('../../util/cache');
function isLogined(req) {
    return req.session.logined;
}

var siteFunc = {

    siteInfos: function (title, cmsDescription, keyWords) {
        var discrip;
        var key;

        if (cmsDescription) {
            discrip = cmsDescription;
        } else {
            discrip = settings.CMSDISCRIPTION;
        }

        if (keyWords) {
            key = keyWords + ',' + settings.SITEBASICKEYWORDS;
        } else {
            key = settings.SITEKEYWORDS;
        }

        return {
            title: title + " | " + settings.SITETITLE,
            cmsDescription: discrip,
            keywords: key,
            siteIcp: settings.SITEICP,
            version : settings.SITEVERSION
        }
    },

    setConfirmPassWordEmailTemp : function(name,token){

        var html = '<p>您好：' + name + '</p>' +
            '<p>我们收到您在 <strong>' + settings.SITETITLE + '</strong> 的注册信息，请点击下面的链接来激活帐户：</p>' +
            '<a href="' + settings.SITEDOMAIN + '/users/reset_pass?key=' + token + '">重置密码链接</a>' +
            '<p>若您没有在 <strong>' + settings.SITETITLE + '</strong> 填写过注册信息，说明有人滥用了您的电子邮箱，请忽略或删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
            '<p> <strong>' + settings.SITETITLE + ' </strong> 谨上。</p>';

        return html;

    },

    setNoticeToAdminEmailTemp : function(obj){
        var msgDate = moment(obj.date).format('YYYY-MM-DD HH:mm:ss');
        var html ='';
        html += '主人您好，'+obj.uName+'于 '+msgDate +' 在 <strong>' + settings.SITETITLE + '</strong> 的文章 <a href="' + settings.SITEDOMAIN + '/details/'+obj.contentId+'.html">'+obj.contentTitle+'</a> 中留言了';
        return html;
    },

    setNoticeToUserEmailTemp : function(obj){
        var msgDate = moment(obj.date).format('YYYY-MM-DD HH:mm:ss');
        var html ='';
        html += '主人您好，'+obj.uName+'于 '+msgDate +' 在 <strong>' + settings.SITETITLE + '</strong> 的文章 <a href="' + settings.SITEDOMAIN + '/details/'+obj.contentId+'.html">'+obj.contentTitle+'</a> 中回复了您';
        return html;
    },

    setBugToAdminEmailTemp : function(obj){
        var msgDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        var html ='';
        html += '主人您好，测试管理员（'+obj.email+')于 '+msgDate +' 在 <strong>' + settings.SITETITLE + '</strong> 的后台模块 <strong>'+obj.contentFrom+'</strong> 中说：<br>'+obj.content;
        return html;
    },

    getCategoryList: function () {
        return ContentCategory.find({'parentID': '0', 'state': '1'}, 'name defaultUrl').sort({'sortId': 1}).find();
    },

    getHotItemListData: function (q) {
        return Content.find(q, 'stitle').sort({'clickNum': -1}).skip(0).limit(10);
    },

    getNewItemListData : function(q){
        return Content.find(q, 'stitle').sort({'date': -1}).skip(0).limit(10);
    },

    getFriendLink: function () {
        return Ads.find({'category': 'friendlink'});
    },

    getMessageList : function(contentId){
        return Message.find({'contentId' : contentId})
    },

    setDataForIndex: function (req, res, q, title) {
        var requireField = 'title date commentNum discription clickNum isTop sImg';
        var documentList = DbOpt.getPaginationResult(Content, req, res, q, requireField);
        var tagsData = DbOpt.getDatasByParam(ContentTags, req, res, {});
        return {
            siteConfig: siteFunc.siteInfos("首页"),
            documentList: documentList.docs,
            hotItemListData: siteFunc.getHotItemListData({}),
            friendLinkData: siteFunc.getFriendLink(),
            cateTypes: siteFunc.getCategoryList(),
            cateInfo: '',
            tagsData: tagsData,
            pageInfo: documentList.pageInfo,
            pageType: 'index',
            logined: isLogined(req),
            layout: 'web/public/defaultTemp'
        }
    },

    setDataForCate: function (req, res, dq, cq, cateInfo) {
        var requireField = 'title date commentNum discription clickNum comments isTop sImg';
        var documentList = DbOpt.getPaginationResult(Content, req, res, dq, requireField);
        var currentCateList = ContentCategory.find(cq).sort({'sortId': 1});
        var tagsData = DbOpt.getDatasByParam(ContentTags, req, res, {});
        return {
            siteConfig: siteFunc.siteInfos(cateInfo.name, cateInfo.comments, cateInfo.keywords),
            documentList: documentList.docs,
            currentCateList: currentCateList,
            hotItemListData: siteFunc.getHotItemListData(dq),
            friendLinkData: siteFunc.getFriendLink(),
            tagsData: tagsData,
            cateInfo: cateInfo,
            cateTypes: siteFunc.getCategoryList(),
            pageInfo: documentList.pageInfo,
            pageType: 'cate',
            logined: isLogined(req),
            layout: 'web/public/defaultTemp'
        }
    },

    setDetailInfo: function (req, res, cateQuery, doc) {
        var currentCateList = ContentCategory.find(cateQuery).sort({'sortId': 1});
        var tagsData = DbOpt.getDatasByParam(ContentTags, req, res, {});
        return {
            siteConfig: siteFunc.siteInfos(doc.title, doc.discription, doc.keywords),
            cateTypes: siteFunc.getCategoryList(),
            currentCateList: currentCateList,
            hotItemListData: siteFunc.getHotItemListData({}),
            newItemListData: siteFunc.getNewItemListData({}),
            friendLinkData: siteFunc.getFriendLink(),
            documentInfo: doc,
            messageList : siteFunc.getMessageList(doc._id),
            pageType: 'detail',
            logined: isLogined(req),
            layout: 'web/public/defaultTemp'
        }
    },

    setDataForSearch: function (req, res, q, searchKey) {
        req.query.searchKey = searchKey;
        var requireField = 'title date commentNum discription clickNum';
        var documentList = DbOpt.getPaginationResult(Content, req, res, q, requireField);
        return {
            siteConfig: siteFunc.siteInfos("文档搜索"),
            documentList: documentList.docs,
            cateTypes: siteFunc.getCategoryList(),
            cateInfo: '',
            pageInfo: documentList.pageInfo,
            pageType: 'search',
            logined: isLogined(req),
            layout: 'web/public/defaultTemp'
        }
    },

    setDataForError: function (req, res, title, errInfo) {
        return {
            siteConfig: siteFunc.siteInfos(title),
            cateTypes: siteFunc.getCategoryList(),
            errInfo: errInfo,
            pageType: 'error',
            logined: isLogined(req),
            layout: 'web/public/defaultTemp'
        }
    },

    setDataForUser: function (req, res, title ,tokenId) {
        return {
            siteConfig: siteFunc.siteInfos(title),
            cateTypes: siteFunc.getCategoryList(),
            userInfo: req.session.user,
            tokenId : tokenId,
            layout: 'web/public/defaultTemp'
        }
    },

    setDataForUserReply: function (req, res, title) {
        req.query.limit = 5;
        var documentList = DbOpt.getPaginationResult(Message, req, res, {'uid' : req.session.user._id});
        return {
            siteConfig: siteFunc.siteInfos(title),
            cateTypes: siteFunc.getCategoryList(),
            userInfo: req.session.user,
            replyList : documentList.docs,
            pageInfo: documentList.pageInfo,
            pageType: 'replies',
            layout: 'web/public/defaultTemp'
        }
    },

    setDataForInfo : function(infoType,infoContent){

        return {
            siteConfig: siteFunc.siteInfos('操作提示'),
            cateTypes: siteFunc.getCategoryList(),
            infoType : infoType,
            infoContent : infoContent,
            layout: 'web/public/defaultTemp'
        }

    },

    setDataForSiteMap: function (req, res) {

        var root_path = settings.SITEDOMAIN;
        var priority = 0.8;
        var freq = 'weekly';
        var lastMod = moment().format('YYYY-MM-DD');
        var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        xml += '<url>';
        xml += '<loc>' + root_path + '</loc>';
        xml += '<changefreq>daily</changefreq>';
        xml += '<lastmod>' + lastMod + '</lastmod>';
        xml += '<priority>' + 0.8 + '</priority>';
        xml += '</url>';
        cache.get('sitemap', function(siteMapData){
            if(siteMapData){ // 缓存已建立
                res.end(siteMapData);
            }else{
                ContentCategory.find({}, 'defaultUrl', function (err, cates) {
                    if (err) {
                        console.log(err);
                    } else {
                        cates.forEach(function (cate) {
                            xml += '<url>';
                            xml += '<loc>' + root_path + '/' +cate.defaultUrl + '___' + cate._id + '</loc>';
                            xml += '<changefreq>weekly</changefreq>';
                            xml += '<lastmod>' + lastMod + '</lastmod>';
                            xml += '<priority>0.5</priority>';
                            xml += '</url>';
                        });

                        Content.find({}, 'title', function (err, contentLists) {
                            if (err) {
                                console.log(err);
                            } else {
                                contentLists.forEach(function (post) {
                                    xml += '<url>';
                                    xml += '<loc>' + root_path + '/details/' + post._id + '.html</loc>';
                                    xml += '<changefreq>Monthly</changefreq>';
                                    xml += '<lastmod>' + lastMod + '</lastmod>';
                                    xml += '<priority>0.5</priority>';
                                    xml += '</url>';
                                });
                                xml += '</urlset>';
                                // 缓存一天
                                cache.set('sitemap', xml, 1000 * 60 * 60 * 24);
                                res.end(xml);
                            }
                        })
                    }

                })
            }
        })

    }

};
module.exports = siteFunc;