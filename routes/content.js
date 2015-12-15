var express = require('express');
var router = express.Router();

/* GET home page. */
//文章类别对象
var ContentCategory = require("../models/ContentCategory");
//数据库操作对象
var DbOpt = require("../models/Dbopt");
// 文档对象
var Content = require("../models/Content");
//文章标签对象
var ContentTags = require("../models/ContentTags");
//留言对象
var Message = require("../models/Message");
//广告对象
var Ads = require("../models/Ads");
//站点配置
var settings = require("../models/db/settings");
var siteFunc = require("../models/db/siteFunc");

var url = require('url');
//二维码对象
var qr = require('qr-image')
//短id
var shortid = require('shortid');
//校验
var validator = require("validator");
//判断是否登录
function isLogined(req){
    return req.session.logined;
}


//文档查询
router.get('/searchResult/items', function(req, res, next) {

    querySearchResult(req, res);

});

//文档查询带分页
router.get('/searchResult/:defaultUrl', function(req, res, next) {

    var defaultUrl = req.params.defaultUrl;
    if (defaultUrl.indexOf("—") >= 0) {
        var searchPageNo = (defaultUrl.split("—")[1]).split(".")[0];
        if(searchPageNo && validator.isNumeric(searchPageNo)){
            req.query.page = searchPageNo;
        }
        querySearchResult(req, res);

    }

});

function querySearchResult(req, res){
    var params = url.parse(req.url,true);
    var searchKey = params.query.searchKey;
    var area = params.query.area;

    var keyPr = [];
    var reKey = new RegExp(searchKey, 'i');
//    模糊查询名称和内容
    if(area === "tags"){
        keyPr = {'tags' : { $regex: reKey } };
    }else{
        keyPr = [];
        keyPr.push({'comments' : { $regex: reKey } });
        keyPr.push({'tags' : { $regex: reKey } });
        keyPr.push({'title' : { $regex: reKey } })
    }

    siteFunc.renderToTargetPageByType(req,res,'search',{query : keyPr , searchKey : searchKey , page : 'searchTemp'});

}



//文章二维码生成(没用，暂时保留)
router.get('/qrImg/show', function(req, res, next) {
    var params = url.parse(req.url,true);
    var detailLink = params.query.detailLink;
    try {
        var img = qr.image(detailLink,{size :10});
        res.writeHead(200, {'Content-Type': 'image/png'});
        img.pipe(res);
    } catch (e) {
        res.writeHead(414, {'Content-Type': 'text/html'});
        res.end('<h1>414 Request-URI Too Large</h1>');
    }
});


//查找指定广告
router.get('/requestAds/ads/item', function(req, res, next) {
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;
    if(shortid.isValid(targetId)){
        Ads.findOne({'_id' : targetId , 'state': '1'}, function (err,result) {
            if(err){
                res.next(err);
            }else{
                return res.json(result);
            }
        })
    }else{
        res.end(settings.system_illegal_param);
    }
});



module.exports = router;
