/**
 * Created by Administrator on 2015/4/15.
 * 管理员对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

//mongoose.connect("mongodb://localhost/doracms")

var adminUser = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    username : String,
    password:   String,
    email : String,
    phoneNum : Number,
    comments : String,
    date: { type: Date, default: Date.now },
    logo: { type: String, default: "/upload/images/defaultlogo.png" },
    group: String
});

var AdminUser = mongoose.model("AdminUser",adminUser);

module.exports = AdminUser;

