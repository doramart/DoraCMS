/**
 * Created by Administrator on 2017/5/19.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var moment = require('moment')

var UserSchema = new Schema({
    _id: {
        type: String,

        'default': shortid.generate
    },
    enable: { type: Boolean, default: true }, //用户是否有效
    name: String,
    userName: String,
    password: String,
    email: String,
    qq: Number,
    phoneNum: Number,
    comments: { type: String, default: "" },
    position: String, // 职位
    company: String,  // 大学或公司
    website: String, // 个人站点
    date: { type: Date, default: Date.now },
    logo: { type: String, default: "/upload/images/defaultlogo.png" },
    group: { type: String, default: "0" },
    gender: String,
    province: String, // 所在省份
    city: String, // 所在城市
    year: Number, // 出生年
    openid: String,   // 针对qq互联
    retrieve_time: { type: Number }, // 用户发送激活请求的时间
    integral: { type: Number, default: 0 } // 用户积分
});

UserSchema.set('toJSON', { getters: true, virtuals: true });
UserSchema.set('toObject', { getters: true, virtuals: true });

UserSchema.path('date').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});

var User = mongoose.model("User", UserSchema);


module.exports = User;
