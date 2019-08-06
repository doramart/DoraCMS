/**
 * Created by Administrator on 2015/4/15.
 * 创作者类别对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var moment = require('moment')
var AdminUser = require('./AdminUser');


var HelpCenterSchema = new Schema({
    _id: {
        type: String,
        'default': shortid.generate
    },
    name: String, // 标题
    lang: {
        type: String,
        default: '1'
    }, // 语言 1简体中文 2 英文 3 繁体中文
    state: {
        type: Boolean,
        default: false
    }, // 启用或禁用
    time: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        default: '0'
    }, // 0为普通 1为其它
    updateTime: {
        type: Date,
        default: Date.now
    }, // 更新时间
    user: {
        type: String,
        ref: 'AdminUser'
    }, // 编辑者
    comments: String
});

HelpCenterSchema.set('toJSON', {
    getters: true,
    virtuals: true
});
HelpCenterSchema.set('toObject', {
    getters: true,
    virtuals: true
});

HelpCenterSchema.path('time').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});

HelpCenterSchema.path('updateTime').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});

var HelpCenter = mongoose.model("HelpCenter", HelpCenterSchema);

module.exports = HelpCenter;