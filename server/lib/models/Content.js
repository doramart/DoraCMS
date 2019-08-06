/**
 * Created by Administrator on 2015/4/15.
 * 管理员用户组对象
 */
var mongoose = require('mongoose');
var settings = require('@configs/settings');
var Schema = mongoose.Schema;
var moment = require('moment')
moment.locale((settings.lang).toLowerCase());
var shortid = require('shortid');
var ContentCategory = require('./ContentCategory');
var ContentTag = require('./ContentTag');
var AdminUser = require('./AdminUser');
var User = require('./User');
var ContentSchema = new Schema({
    _id: {
        type: String,
        'default': shortid.generate
    },
    title: String,
    stitle: String,
    type: {
        type: String,
        default: "1"
    }, // 发布类型 1位普通，2为专题
    categories: [{
        type: String,
        ref: 'ContentCategory'
    }], //文章类别
    sortPath: String, //存储所有父节点结构
    tags: [{
        type: String,
        ref: 'ContentTag'
    }], // 标签
    keywords: [{
        type: String
    }],
    sImg: {
        type: String,
        default: "/upload/images/defaultImg.jpg"
    }, // 文章小图
    videoImg: {
        type: String,
        default: ""
    }, // 视频缩略图
    discription: String,
    appShowType: {
        type: String,
        default: '1'
    }, // app端排版格式 0 不显示图片 1小图 2大图 3视频
    imageArr: [{
        type: String
    }], // 媒体集合（图片）
    videoArr: [{
        type: String
    }], // 媒体集合（影片）
    duration: {
        type: String,
        default: '0:01'
    }, // 针对有视频的帖子时长
    date: {
        type: Date,
        default: Date.now
    },
    updateDate: {
        type: Date,
        default: Date.now
    }, // 更新时间
    author: {
        type: String,
        ref: 'AdminUser'
    }, // 文档作者
    uAuthor: {
        type: String,
        ref: 'User'
    }, // 文档作者(普通用户)
    state: {
        type: String,
        default: '0'
    }, // 0草稿 1待审核 2审核通过 3下架
    dismissReason: String, // 驳回原因(针对审核不通过)
    isTop: {
        type: Number,
        default: 0
    }, // 是否推荐，默认不推荐 0为不推荐，1为推荐
    roofPlacement: {
        type: String,
        default: '0'
    }, // 是否置顶，默认不置顶 0为不置顶，1为置顶
    clickNum: {
        type: Number,
        default: 1
    },
    comments: String,
    simpleComments: String, //带格式的纯文本
    markDownComments: String, // markdow格式
    commentNum: {
        type: Number,
        default: 0
    }, // 评论数
    likeNum: {
        type: Number,
        default: 0
    }, // 喜欢数

});


ContentSchema.index({
    state: 1,
    uAuthor: 1
}); // 添加索引

ContentSchema.set('toJSON', {
    getters: true,
    virtuals: true
});
ContentSchema.set('toObject', {
    getters: true,
    virtuals: true
});

ContentSchema.path('date').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});
ContentSchema.path('updateDate').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});

var Content = mongoose.model("Content", ContentSchema);

module.exports = Content;