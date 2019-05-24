/**
 * Created by Administrator on 2015/4/15.
 * 管理员对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var AdminGroup = require('./AdminGroup');

var AdminUserSchema = new Schema({
    id: String,
    _id: {
        type: String,

        'default': shortid.generate
    },
    name: String,
    userName: String,
    password: String,
    email: String,
    phoneNum: String,
    countryCode: {
        type: String
    }, // 手机号前国家代码
    comments: String,
    date: {
        type: Date,
        default: Date.now
    },
    logo: {
        type: String,
        default: "https://masterchain.oss-cn-hongkong.aliyuncs.com/upload/images/img1547021000228.png"
    },
    enable: {
        type: Boolean,
        default: false
    },
    auth: {
        type: Boolean,
        default: false
    },
    group: {
        type: String,
        ref: 'AdminGroup'
    }
});

AdminUserSchema.statics = {

    getOneItem: function (res, targetId, callBack) {
        AdminUser.findOne({
            '_id': targetId
        }).populate('group').exec(function (err, user) {
            if (err) {
                res.end(err);
            }
            callBack(user);
        })
    }

};


var AdminUser = mongoose.model("AdminUser", AdminUserSchema);

module.exports = AdminUser;