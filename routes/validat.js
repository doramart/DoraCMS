/**
 * Created by Administrator on 2015/4/29.
 * 对权限进行控制
 */
var express = require('express');
var router = express.Router();
//管理员用户组对象
var AdminGroup = require("../models/AdminGroup");
var validator = require("validator");
var adminFunc = require("../models/db/adminFunc");

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

router.get("/manage",function(req,res,next){
    if(isAdminLogined(req)){
        adminFunc.authDoraCMS(req, res,function(){
            next();
        });
    }else{
        res.redirect("/admin");
    }
});

router.get("/manage/*",function(req,res,next){

    if(isAdminLogined(req)){
        next();
    }else{
        res.redirect("/admin");
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