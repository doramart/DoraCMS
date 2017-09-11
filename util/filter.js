/**
 * Created by Administrator on 2015/9/9.
 */
var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var settings = require('../models/db/settings');
var siteFunc = require('../models/db/siteFunc');
var UserNotify = require('../models/UserNotify');
//用户实体类
var User = require("../models/User");

function gen_session(user, res) {
    var auth_token = user._id + '$$$$'; // 以后可能会存储更多信息，用 $$$$ 来分隔
    res.cookie(settings.auth_cookie_name, auth_token,
        {path: '/', maxAge: 1000 * 60 * 60 * 24 * 30, signed: true, httpOnly: true}); //cookie 有效期30天
}

exports.gen_session = gen_session;


exports.authUser = function (req, res, next) {
    if (settings.debug && req.cookies['mock_user']) {
        var mockUser = JSON.parse(req.cookies['mock_user']);
        req.session.user = new UserModel(mockUser);
         return next();
    }

    if (req.session.user) {
        UserNotify.getNoReadNotifyCountByUserId(req.session.user._id,'user',function(err,count){
            req.session.user.msg_count = count;
            req.session.logined = true;
            return next();
        })

    } else {
        var auth_token = req.signedCookies[settings.auth_cookie_name];
        if (!auth_token) {
            return next();
        }else{
            var auth = auth_token.split('$$$$');
            var user_id = auth[0];

            User.findOne({'_id' : user_id},function(err,user){
                if(err){
                    console.log(err)
                }else{
                    if(!user){
                        return next();
                    }
                    UserNotify.getNoReadNotifyCountByUserId(user_id,'user',function(err,count){
                        user.msg_count = count;
                        req.session.user = user;
                        req.session.logined = true;
                        return next();
                    })
                }
            })

        }
    }
};