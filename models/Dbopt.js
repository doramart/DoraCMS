/**
 * Created by Administrator on 2015/4/18.
 */

var url = require('url');
//加密类
var crypto = require("crypto");
var mongoose = require('mongoose');
var shortid = require('shortid');
var Message = require('./Message');
var AdminUser = require("./AdminUser");
var UserNotify = require("../models/UserNotify");
var Content = require("../models/Content");
var ContentCategory = require("../models/ContentCategory");
var ContentTemplate = require("../models/ContentTemplate");

//站点配置
var settings = require("../models/db/settings");
var db = mongoose.connect(settings.URL);
//mongoose.connect('mongodb://'+settings.USERNAME+':'+settings.PASSWORD+'@'+settings.HOST+':'+settings.PORT+'/'+settings.DB+'');

//信息删除操作

var DbOpt = {


    del : function(obj,req,res,logMsg){
        var params = url.parse(req.url,true);
        var targetId = params.query.uid;
        if(shortid.isValid(targetId)){
            obj.remove({_id : params.query.uid},function(err,result){
                if(err){
                    res.end(err);
                }else{
                    console.log(logMsg+" success!");
                    res.end("success");
                }
            })
        }else{
            res.end(settings.system_illegal_param);
        }

    },
    findAll : function(obj,req,res,logMsg){//查找指定对象所有记录
        obj.find({}, function (err,result) {
            if(err){
                res.next(err);
            }else{
                console.log(logMsg+" success!");
                return res.json(result);
            }
        })
    },
    findOne : function(obj,req,res,logMsg){ //根据ID查找单条记录
        var params = url.parse(req.url,true);
        var targetId = params.query.uid;
        if(shortid.isValid(targetId)){
            obj.findOne({_id : targetId}, function (err,result) {
                if(err){
                    res.next(err);
                }else{
                    console.log(logMsg+" success!");
                    return res.json(result);
                }
            })
        }else{
            res.end(settings.system_illegal_param);
        }

    },
    updateOneByID : function(obj,req,res,logMsg){
        var params = url.parse(req.url,true);
        var targetId = params.query.uid;

        if(shortid.isValid(targetId)){
            var conditions = {_id : targetId};
            req.body.updateDate = new Date();
            var update = {$set : req.body};
            obj.update(conditions, update, function (err,result) {
                if(err){
                    res.end(err);
                }else{
                    console.log(logMsg+" success!");
                    res.end("success");
                }
            })
        }else{
            res.end(settings.system_illegal_param);
        }

    },
    addOne : function(obj,req,res){
        var newObj = new obj(req.body);
        newObj.save(function(err){
            if(err){
                res.end(err);
            }else{
                res.end("success");
            }
        });
    },

    pagination : function(obj,req,res,conditions){

        var params = url.parse(req.url,true);
        var startNum = (params.query.currentPage - 1)*params.query.limit + 1;
        var currentPage = Number(params.query.currentPage);
        var limit = Number(params.query.limit);
        var pageInfo;

//    根据条件查询记录(如果有条件传递，则按条件查询)
        var query;
        if(conditions && conditions.length > 1){
            query=obj.find().or(conditions);
        }
        else if(conditions){
            query=obj.find(conditions);
        }
        else{
            query=obj.find({});
        }
        query.sort({'date': -1});

        if(obj === Message){
            query.populate('author').populate('replyAuthor').populate('adminAuthor');
        }else if(obj === AdminUser){
            query.populate('group');
        }else if(obj === UserNotify){
            query.populate('user').populate('notify');
        }else if(obj === Content){
            query.populate('category').populate('author');
        }else if(obj === ContentCategory){
            query.populate('contentTemp');
        }else if(obj === ContentTemplate){
            query.populate('items');
        }

        query.exec(function(err,docs){
            if(err){
                console.log(err)

            }else {
                pageInfo = {
                    "totalItems" : docs.length,
                    "currentPage" : currentPage,
                    "limit" : limit,
                    "startNum" : Number(startNum)
                };

                return res.json({
                    docs : docs.slice(startNum - 1,startNum + limit -1),
                    pageInfo : pageInfo
                });
            }
        })
    },

    getPaginationResult : function(obj,req,res,q,filed){// 通用查询，带分页，注意参数传递格式,filed为指定字段
        var searchKey = req.query.searchKey;
        var page = parseInt(req.query.page);
        var limit = parseInt(req.query.limit);
        if (!page) page = 1;
        if (!limit) limit = 15;
        var order = req.query.order;
        var sq = {}, Str, A = 'problemID', B = 'asc';
        if (order) {    //是否有排序请求
            Str = order.split('_');
            A = Str[0]; B = Str[1];
            sq[A] = B;    //关联数组增加查询条件，更加灵活，因为A是变量
        } else {
            sq.date = -1;    //默认排序查询条件
        }

        var startNum = (page - 1)*limit;
        var resultList;
        var resultNum;
        if(q && q.length > 1){ // 多条件只要其中一条符合
            resultList = obj.find().or(q,filed).sort(sq).skip(startNum).limit(limit);
            resultNum = obj.find().or(q,filed).count();
        }else{
            resultList = obj.find(q,filed).sort(sq).skip(startNum).limit(limit);
            resultNum = obj.find(q,filed).count();
        }
        //        分页参数
        var pageInfo = {
            "totalItems" : resultNum,
            "currentPage" : page,
            "limit" : limit,
            "startNum" : startNum +1,
            "searchKey" : searchKey
        };
        var datasInfo = {
            docs : resultList,
            pageInfo : pageInfo
        };

        return datasInfo;
    },

    getDatasByParam : function(obj,req,res,q){// 通用查询list不带分页，注意参数传递格式,通过express-promise去掉了回调方式返回数据
//        默认查询所有记录，有条件顺带排序和查询部分记录
        var order = req.query.order;
        var limit = parseInt(req.query.limit);
        var sq = {}, Str, A = 'problemID', B = 'asc';
        if (order) {    //是否有排序请求
            Str = order.split('_');
            A = Str[0]; B = Str[1];
            sq[A] = B;    //关联数组增加查询条件，更加灵活，因为A是变量
        } else {
            sq.date = -1;    //默认排序查询条件
        }
        if(!limit){
            return obj.find(q).sort(sq);
        }else{
            return obj.find(q).sort(sq).skip(0).limit(limit);
        }


    },

    getKeyArrByTokenId : function(tokenId){
        var newLink = DbOpt.decrypt(tokenId,settings.encrypt_key);
        var keyArr = newLink.split('$');
        return keyArr;
    },

    getCount : function(obj,req,res,conditions){ // 查询指定对象的数量
        obj.count(conditions, function (err, count) {
            if (err){
                console.log(err);
            }else{
                return res.json({
                    count : count
                });
            }

        });
    },
    encrypt : function(data,key){ // 密码加密
        var cipher = crypto.createCipher("bf",key);
        var newPsd = "";
        newPsd += cipher.update(data,"utf8","hex");
        newPsd += cipher.final("hex");
        return newPsd;
    },
    decrypt : function(data,key){ //密码解密
        var decipher = crypto.createDecipher("bf",key);
        var oldPsd = "";
        oldPsd += decipher.update(data,"hex","utf8");
        oldPsd += decipher.final("utf8");
        return oldPsd;
    }
};



module.exports = DbOpt;