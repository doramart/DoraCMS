/**
 * Created by Administrator on 2015/4/15.
 * 管理员用户组对象
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var shortid = require('shortid');

var content = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    title:  String,
    stitle : String,
    type: { type: String, default: "content" }, // 发布形式 默认为普通文档,约定 singer 为单页面文档
    category : String, //文章类别
    sortPath : String, //存储所有父节点结构
    tags : String, // 标签
    keywords : String,
    sImg : { type: String, default: "/upload/images/defaultImg.jpg" }, // 文章小图
    discription : String,
    date: { type: Date, default: Date.now },
    updateDate: { type: Date, default: Date.now }, // 更新时间
    contentTemp : { type: String, default: "defaultTemp" }, // 内容模板
    author : { type: String, default: "生哥" },
    state : { type: Boolean, default: true },  // 是否在前台显示，默认显示
    isTop : { type: Number, default: 0 },  // 是否推荐，默认不推荐 0为不推荐，1为推荐
    clickNum : { type: Number, default: 1 },
    comments : {},
    commentNum : { type: Number, default: 0 }, // 评论数
    likeNum : { type: Number, default: 0 }, // 喜欢数
    likeUserIds : String, // 喜欢该文章的用户ID集合
    from : { type: String, default: '1' }, // 来源 1为原创 2为转载


//    影片内容相关属性
    alias :  String,  // 影片别名
    director :  String,  // 影片导演
    actor :  String,  // 影片演员
    filmType : String,  // 影片类型
    releaseTime : String,  // 影片上映时间
    time :  String,  // 影片长度

//    插件信息相关属性
    repositoryPath : String, // git 知识库路径
    downPath : String, // git 项目下载地址
    previewPath : String // 插件预览地址
});

var Content = mongoose.model("Content",content);

module.exports = Content;

