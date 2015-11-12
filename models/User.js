/**
 * Created by Administrator on 2015/4/11.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');

var UserSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    userName : String,
    password:   String,
    email : String,
    qq : Number,
    phoneNum : Number,
    comments : { type: String, default: "这个人很懒，什么都没有留下..." },
    position : String, // 职位
    company : String,  // 大学或公司
    website : String, // 个人站点
    date: { type: Date, default: Date.now },
    logo: { type: String, default: "/upload/images/defaultlogo.png" },
    group: { type: String, default: "0" },
    gender : String,
    province : String, // 所在省份
    city : String, // 所在城市
    year : Number, // 出生年
    openid : String,   // 针对qq互联
    retrieve_time : {type: Number} // 用户发送激活请求的时间

});

var User = mongoose.model("User",UserSchema);

module.exports = User;
