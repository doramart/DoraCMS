/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var User = require('./User');
var Notify = require('./Notify');

var UserNotifySchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    isRead : {type: Boolean, default: false},
    user   : {type: String, ref: 'User'},  // 用户消息所属者
    systemUser   : { type: String, ref: 'AdminUser' },  // 用户消息所属者
    notify : {type: String, ref : 'Notify'},   // 关联的Notify
    date   : { type: Date, default: Date.now }
});

UserNotifySchema.index({date: -1});

UserNotifySchema.statics = {

    addNotifyByUsers : function(res,users,notify){
        if(users.length > 0){
            for(var i=0;i<users.length;i++){
                var userNotify = new UserNotify();
                userNotify.systemUser = users[i]._id;
                userNotify.notify = notify;
                userNotify.save(function(err){
                    if(err){
                        res.end(err);
                    }
                });
            }
        }
    },

    setHasRead : function(msgId,callback){
        var idObj = msgId.split(',');
        var query ;
        if(idObj.length > 1){
            query = {'_id':{$in: idObj}};
        }else{
            query = {'_id':idObj[0]};
        }
        UserNotify.update(query,{$set:{'isRead':true}},{ multi: true },callback);
    },

    getNoReadNotifyCountByUserId : function(userId,type,callBack){
        if(userId){
            var msgQuery = {};
            if(type == 'user'){
                msgQuery = {'user': userId , 'isRead' : false};
            }else if(type == 'adminUser'){
                msgQuery = {'systemUser': userId , 'isRead' : false};
            }
            UserNotify.count(msgQuery,callBack);
        }else{
            callBack(0);
        }
    },

    getNotifyPaginationResult : function(req,res,userId){
        var msgQuery = {'user': userId };
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
        var resultList = UserNotify.find(msgQuery).sort(sq).skip(startNum).limit(limit).populate('user').populate('notify').exec();
        var resultNum = UserNotify.find(msgQuery).count();
        //        分页参数
        var pageInfo = {
            "totalItems" : resultNum,
            "currentPage" : page,
            "limit" : limit,
            "startNum" : startNum +1
        };
        var datasInfo = {
            docs : resultList,
            pageInfo : pageInfo
        };
        return datasInfo;
    }
};


var UserNotify = mongoose.model("UserNotify",UserNotifySchema);
module.exports = UserNotify;

