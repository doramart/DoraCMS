/**
 * Created by Administrator on 2016/1/16.
 * 权限控制层
 * 对权限和参数做初次过滤
 */

var express = require('express');
var router = express.Router();
router.caseSensitive = true;
var url = require('url');
//管理员用户组对象
var AdminGroup = require("../models/AdminGroup");
var validator = require("validator");
//站点配置
var settings = require("../models/db/settings");
var adminFunc = require("../models/db/adminFunc");
//短id
var shortid = require('shortid');

function isAdminLogined(req){
    return req.session.adminlogined;
}


router.get("/",function(req,res,next){
    if(isAdminLogined(req)){
        res.redirect("/admin/manage");
    }else{
        next();
    }
});

//管理员主页
router.get(["/manage","/manage/*"],function(req,res,next){
    if(isAdminLogined(req)){
        next();
    }else{
        res.redirect("/admin");
    }
});

//模块管理页面
router.get('/manage/:targetPage', function(req, res, next) {
    var currentPage = req.params.targetPage;
    if(settings[currentPage]){
        if(!adminFunc.checkAdminPower(req,settings[currentPage][0] + '_view')){
            res.render("manage/public/notice", adminFunc.setDataForInfo('danger','对不起，您无权操作 <strong>'+settings[currentPage][1]+'</strong> 模块！'));
        }else{
            next();
        }
    }else{
        next();
    }
});

//通用对象列表数据查询
router.get('/manage/getDocumentList/:defaultUrl',function(req,res,next){
    var currentPage = req.params.defaultUrl;
    if(adminFunc.checkAdminPower(req,currentPage + '_view')){
        next();
    }else{
        return res.json({});
    }
});

//获取单个对象数据
router.get('/manage/:defaultUrl/item',function(req,res,next){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;
    if(adminFunc.checkAdminPower(req,currentPage + '_view')){
        if(shortid.isValid(targetId)){
            next();
        }else{
            res.end(settings.system_illegal_param);
        }
    }else{
        return res.json({});
    }

});

//对象新增
router.post('/manage/:defaultUrl/addOne',function(req,res,next){

    var currentPage = req.params.defaultUrl;
    if(adminFunc.checkAdminPower(req,currentPage + '_add')){
        next();
    }else{
        res.end(settings.system_noPower);
    }
});

//更新单条记录(执行更新)
router.post('/manage/:defaultUrl/modify',function(req,res,next){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;
    if(adminFunc.checkAdminPower(req,currentPage + '_modify')){
        if(shortid.isValid(targetId)){
            next();
        }else{
            res.end(settings.system_illegal_param);
        }
    }else{
        res.end(settings.system_noPower);
    }
});

//通用对象删除
router.get('/manage/:defaultUrl/del',function(req,res,next){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;
    if(adminFunc.checkAdminPower(req,currentPage + '_del')){
        if(shortid.isValid(targetId)){
            next();
        }else{
            res.end(settings.system_illegal_param);
        }

    }else{
        res.end(settings.system_noPower);
    }
});

//批量删除对象
router.get('/manage/:defaultUrl/batchDel',function(req,res,next){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var ids = params.query.ids;
    var idsArr = ids.split(',');
    if(adminFunc.checkAdminPower(req,currentPage + '_del')){
        if(idsArr.length > 0){
            next();
        }else{
            res.end(settings.system_atLeast_one);
        }
    }else{
        res.end(settings.system_noPower);
    }

});

//访问指定对象的数据列表(不带分页)
router.get('/manage/:modular/list', function(req, res, next) {
    var currentPage = req.params.modular;
    if(settings[currentPage]){
        if(!adminFunc.checkAdminPower(req,settings[currentPage][0] + '_view')){
            return res.json({});
        }else{
            next();
        }
    }else{
        next();
    }
});


//自定义校验扩展
validator.extend('isUserName', function (str) {
    return /^[a-zA-Z][a-zA-Z0-9_]{4,11}$/.test(str);
});

validator.extend('isGBKName', function (str) {
    return /[\u4e00-\u9fa5]/.test(str);
});

validator.extend('isPsd', function (str) {
    return /(?!^\\d+$)(?!^[a-zA-Z]+$)(?!^[_#@]+$).{5,}/.test(str);
});

validator.extend('isQQ', function (str) {
    return RegExp(/^[1-9][0-9]{4,9}$/).test(str);
});

//只能是英文
validator.extend('isEn', function (str) {
    return /^\S+[a-z A-Z]$/.test(str);
});


module.exports = router;