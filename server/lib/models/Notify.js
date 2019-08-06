/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var User = require('./User');
var AdminUser = require('./AdminUser');
var Content = require('./Content');
var moment = require('moment')

var NotifySchema = new Schema({
    _id: {
        type: String,
        
        'default': shortid.generate
    },
    title: { type: String },   // 消息的标题
    content: { type: String },   // 消息的内容
    type: { type: String, enum: ['1', '2', '3'] },  // 消息的类型，1: 公告 Announce，2: 提醒 Remind，3：信息 Message
    target: { type: String, ref: 'Content' },    // 目标的ID
    targetType: { type: String },    // 目标的类型
    action: { type: String },    // 提醒信息的动作类型
    sender: { type: String, ref: 'User' },    // 发送者的ID
    adminSender: { type: String, ref: 'AdminUser' },    // 发送者的ID
    systemSender: { type: String }, // 系统消息发送者
    date: { type: Date, default: Date.now }
});


NotifySchema.set('toJSON', { getters: true, virtuals: true });
NotifySchema.set('toObject', { getters: true, virtuals: true });

NotifySchema.path('date').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});

var Notify = mongoose.model("Notify", NotifySchema);

module.exports = Notify;

