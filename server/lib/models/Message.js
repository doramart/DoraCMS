/**
 * Created by Administrator on 2015/4/15.
 * 留言管理
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var moment = require('moment')
moment.locale('zh-cn');
var AdminUser = require('./AdminUser');
var User = require('./User');
var Content = require('./Content');
var MessageSchema = new Schema({
    _id: {
        type: String,
        
        'default': shortid.generate
    },
    contentId: {
        type: String,
        ref: 'Content'
    }, // 留言对应的内容ID
    contentTitle: String, // 留言对应的内容标题
    author: {
        type: String,
        ref: 'User'

    },  // 留言者ID
    adminAuthor: {
        type: String,
        ref: 'AdminUser'

    },// 管理员ID
    replyAuthor: {
        type: String,
        ref: 'User'
    },   // 被回复者ID
    adminReplyAuthor: {
        type: String,
        ref: 'AdminUser'
    },   // 被回复者ID
    utype: { type: String, default: '0' }, // 评论者类型 0,普通用户，1,管理员
    relationMsgId: String, // 关联的留言Id
    date: { type: Date, default: Date.now }, // 留言时间
    praiseNum: { type: Number, default: 0 }, // 被赞次数
    hasPraise: { type: Boolean, default: false }, //  当前是否已被点赞
    praiseMembers: String, // 点赞用户id集合
    content: { type: String, default: "输入评论内容..." }// 留言内容
});


MessageSchema.set('toJSON', { getters: true, virtuals: true });
MessageSchema.set('toObject', { getters: true, virtuals: true });

MessageSchema.path('date').get(function (v) {
    return moment(v).startOf('hour').fromNow();
});

var Message = mongoose.model("Message", MessageSchema);

module.exports = Message;

