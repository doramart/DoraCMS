/**
 * Created by Administrator on 2015/4/15.
 * 管理员用户组对象
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var shortid = require('shortid');
var ContentCategory = require('./ContentCategory');
var AdminUser = require('./AdminUser');
var ContentSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    title:  String,
    stitle : String,
    type: { type: String, default: "content" }, // 发布形式 默认为普通文档,约定 singer 为单页面文档
    category : { type : String , ref : 'ContentCategory'}, //文章类别
    sortPath : String, //存储所有父节点结构
    tags : String, // 标签
    keywords : String,
    sImg : { type: String, default: "/upload/images/defaultImg.jpg" }, // 文章小图
    discription : String,
    date: { type: Date, default: Date.now },
    updateDate: { type: Date, default: Date.now }, // 更新时间
    author : { type: String , ref : 'AdminUser'}, // 文档作者
    state : { type: Boolean, default: true },  // 是否在前台显示，默认显示
    isTop : { type: Number, default: 0 },  // 是否推荐，默认不推荐 0为不推荐，1为推荐
    clickNum : { type: Number, default: 1 },
    comments : {},
    commentNum : { type: Number, default: 0 }, // 评论数
    likeNum : { type: Number, default: 0 }, // 喜欢数
    likeUserIds : String, // 喜欢该文章的用户ID集合
    from : { type: String, default: '1' }, // 来源 1为原创 2为转载


//    插件信息相关属性
    repositoryPath : String, // git 知识库路径
    downPath : String, // git 项目下载地址
    previewPath : String // 插件预览地址
});



ContentSchema.statics = {
//更新评论数
    updateCommentNum : function(contentId,key,callBack){
        Content.findOne({'_id' : contentId},'commentNum',function(err,doc){
            if(err){
                res.end(err)
            }
            if(key === 'add'){
                doc.commentNum = doc.commentNum + 1;
            }else if(key === 'del'){
                doc.commentNum = doc.commentNum - 1;
            }
            doc.save(function(err){
                if(err) throw err;
                callBack();
            })
        })
    }

};



var Content = mongoose.model("Content",ContentSchema);

module.exports = Content;

