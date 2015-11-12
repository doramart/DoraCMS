/**
 * Created by Administrator on 2015/4/15.
 * 留言管理
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var AdminUser = require('./AdminUser');
var User = require('./User');
var MessageSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    contentId : String, // 留言对应的内容ID
    contentTitle : String, // 留言对应的内容标题
    author : {
        type : String,
        ref : 'User'

    },  // 留言者ID
    replyAuthor : {
        type : String,
        ref : 'User'

    },   // 被回复者ID
    adminAuthor : {
        type : String,
        ref : 'AdminUser'

    },// 管理员ID
    utype : {type : String ,default : '0'}, // 评论者类型 0,普通用户，1,管理员
    relationMsgId : String, // 关联的留言Id
    date: { type: Date, default: Date.now }, // 留言时间
    praiseNum : {type : Number , default : 0}, // 被赞次数
    hasPraise : {type : Boolean , default : false}, //  当前是否已被点赞
    praiseMembers : String, // 点赞用户id集合
    content: { type : String , default : "输入评论内容..."}// 留言内容
});

var Message = mongoose.model("Message",MessageSchema);

module.exports = Message;

