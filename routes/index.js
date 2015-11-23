var express = require('express');
var router = express.Router();

//数据库操作对象
var DbOpt = require("../models/Dbopt");
// 文档对象
var Content = require("../models/Content");
//文章类别对象
var ContentCategory = require("../models/ContentCategory");
//短id
var shortid = require('shortid');
//校验
var validator = require("validator");
//时间格式化
var moment = require('moment');
//站点配置
var settings = require("../models/db/settings");
var siteFunc = require("../models/db/siteFunc");
var url = require('url');
//缓存
var cache = require('../util/cache');


/* GET home page. */
router.get('/', function (req, res, next) {

    res.render('web/index', siteFunc.setDataForIndex(req, res, {'type': 'content','state' : true}, '首页'));

});

//缓存站点地图
router.get("/sitemap.html", function (req, res, next) {
    var siteMapData;
    var siteMapNeedData = {
        siteConfig: siteFunc.siteInfos("网站地图"),
        documentList: siteMapData,
        cateTypes: siteFunc.getCategoryList(),
        logined: req.session.logined,
        layout: 'web/public/defaultTemp'
    };

    cache.get(settings.session_secret + '_siteMapHtml',function(siteMapHtml){
       if(siteMapHtml) {
           siteMapNeedData.documentList = siteMapHtml;
           res.render('web/sitemap', siteMapNeedData);
       }else{
           Content.find({},'title',function(err,docs){
               if(err){
                   res.end(err);
               }else{
                   siteMapNeedData.documentList = docs;
                   cache.set(settings.session_secret + '_siteMapHtml', docs, 1000 * 60 * 60 * 24); // 缓存一天
                   res.render('web/sitemap', siteMapNeedData);
               }
           })
       }
    });
});


//文档详情页面
router.get('/details/:url', function (req, res, next) {

    var url = req.params.url;
    var currentId = url.split('.')[0];
    if(shortid.isValid(currentId)){
        Content.findOne({ '_id': currentId , 'state' : true}, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                if (result) {
//                更新访问量
                    result.clickNum = result.clickNum + 1;
                    result.save(function(){
                        var cateParentId = result.sortPath.split(',')[1];
                        var cateQuery = {'sortPath': { $regex: new RegExp(cateParentId, 'i') }};
//                        var reQuery = {'sortPath': { $regex: new RegExp(cateParentId, 'i') },'isTop' : 1};
                        Content.count(cateQuery,function(err,reCount){
                            res.render('web/temp/' + result.contentTemp + '/detail', siteFunc.setDetailInfo(req, res, cateQuery, reCount, result));
                        })
                    })
                } else {
                    res.render('web/public/do404', { siteConfig: siteFunc.siteInfos("页面未找到")});
                }
            }
        });
    }else{
        res.render('web/public/do404', { siteConfig: siteFunc.siteInfos("页面未找到")});
    }

});


//分类列表页面  http://127.0.0.1/DoraCms___VylIn1IU-1.html
router.get('/:defaultUrl', function (req, res, next) {

    var defaultUrl = req.params.defaultUrl;
    var url = defaultUrl.split('___')[1];

    var indexUrl = defaultUrl.split('—')[0];

    if (indexUrl == 'page') { // 首页的分页
        var indexPage = defaultUrl.split('—')[1].split(".")[0];
        if(indexPage && validator.isNumeric(indexPage)){
            req.query.page = indexPage;
        }
        res.render('web/index', siteFunc.setDataForIndex(req, res, {'type': 'content','state' : true}, '首页'));
    } else {
        var currentUrl = url;
        if (url.indexOf("—") >= 0) {
            currentUrl = url.split("—")[0];
            var catePageNo = (url.split("—")[1]).split(".")[0];
            if(catePageNo && validator.isNumeric(catePageNo)){
                req.query.page = catePageNo;
            }
        }
        queryCatePage(req, res, currentUrl);
    }

});

//分类列表页面  http://127.0.0.1/front-development/AngluarJs___EyW7kj6w
router.get('/:forder/:defaultUrl', function (req, res, next) {

    var defaultUrl = req.params.defaultUrl;
    var url = defaultUrl.split('___')[1];

    var currentUrl = url;
    if (url.indexOf("—") >= 0) {
        currentUrl = url.split("—")[0];
        var catePageNo = (url.split("—")[1]).split(".")[0]
        if(catePageNo && validator.isNumeric(catePageNo)){
            req.query.page = catePageNo;
        }
    }

    queryCatePage(req, res, currentUrl);

});

//分类页面路由设置
function queryCatePage(req, res, cateId) {

    if(shortid.isValid(cateId)){
        ContentCategory.findOne({"_id": cateId}, function (err, result) {
            if (err) {
                res.render('web/public/do404', { siteConfig: siteFunc.siteInfos("操作失败")});
            } else {
                if (result) {
                    var contentQuery = {'sortPath': { $regex: new RegExp(result._id, 'i') },'state' : true};
                    var cateParentId = result.sortPath.split(',')[1];
                    var cateQuery = {'sortPath': { $regex: new RegExp(cateParentId, 'i') }};
                    res.render('web/temp/' + result.contentTemp + '/contentList', siteFunc.setDataForCate(req, res, contentQuery, cateQuery ,result));
                }
                else {
                    res.render('web/public/do404', { siteConfig: siteFunc.siteInfos("操作失败") });
                }
            }
        })
    }else{
        res.render('web/public/do404', { siteConfig: siteFunc.siteInfos("页面未找到") });
    }

}

module.exports = router;
