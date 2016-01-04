/**
 * Created by Administrator on 2015/4/15.
 * 管理员对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var AdminGroup = require('./AdminGroup');

var AdminUserSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    userName : String,
    password:   String,
    email : String,
    phoneNum : Number,
    comments : String,
    date: { type: Date, default: Date.now },
    logo: { type: String, default: "/upload/images/defaultlogo.png" },
    auth: { type : Boolean ,default :false},
    group: {
        type : String,
        ref : 'AdminGroup'

    }
});


var AdminUser = mongoose.model("AdminUser",AdminUserSchema);

module.exports = AdminUser;

