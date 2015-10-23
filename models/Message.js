/**
 * Created by Administrator on 2015/4/15.
 * 留言管理
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var message = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    contentId : String, //留言对应的内容ID
    contentTitle : String, // 留言对应的内容标题
    uName : String, // 评论者用户名
    uid :  String, // 评论者ID
    uEmail : String, // 评论者邮箱
    ulogo : String, // 评论者头像
    relationMsgId : String, // 关联的留言Id
    relationUid :  String, // 关联用户ID
    relationUName :  String, // 关联用户名
    relationEmail :  String, // 关联用户邮箱（被评论者）
    date: { type: Date, default: Date.now }, // 留言时间
    praiseNum : {type : Number , default : 0}, // 被赞次数
    hasPraise : {type : Boolean , default : false}, //  当前是否已被点赞
    praiseMembers : String, // 点赞用户id集合
    content: { type : String , default : "输入评论内容..."}// 留言内容
});

var Message = mongoose.model("Message",message);

module.exports = Message;

