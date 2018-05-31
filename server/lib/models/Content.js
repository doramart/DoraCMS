/**
 * Created by Administrator on 2015/4/15.
 * 管理员用户组对象
 */
var mongoose = require('mongoose');
var settings = require('../../../configs/settings');
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
    type: { type: String, default: "1" }, // 发布类型 1位普通，2为快讯 3为 twiter
    categories: [{ type: String, ref: 'ContentCategory' }], //文章类别
    sortPath: String, //存储所有父节点结构
    tags: [{ type: String, ref: 'ContentTag' }], // 标签
    keywords: String,
    sImg: { type: String, default: "/upload/images/defaultImg.jpg" }, // 文章小图
    discription: String,
    date: { type: Date, default: Date.now },
    updateDate: { type: Date, default: Date.now }, // 更新时间
    author: { type: String, ref: 'AdminUser' }, // 文档作者
    uAuthor: { type: String, ref: 'User' }, // 文档作者(普通用户)
    state: { type: Boolean, default: true },  // 是否在前台显示，默认显示
    isTop: { type: Number, default: 0 },  // 是否推荐，默认不推荐 0为不推荐，1为推荐
    clickNum: { type: Number, default: 1 },
    comments: String,
    markDownComments: String, // markdow格式
    commentNum: { type: Number, default: 0 }, // 评论数
    likeNum: { type: Number, default: 0 }, // 喜欢数
    likeUserIds: [{ type: String, default: [] }], // 喜欢该文章的用户ID集合
    from: { type: String, default: '1' }, // 来源 1为原创 2为转载 3为用户发送

    // 以下针对快讯
    isFlash: { type: Boolean, default: false }, // 是否属于快讯
    profitable: [{ type: String, default: [] }], // 认为利好的用户
    bearish: [{ type: String, default: [] }], // 认为利空的用户
    postValue: { type: Number, default: 3 }, // 推荐指数

    // 以下针对推特
    translate: { type: String, default: '' }, //推特翻译
    twiterAuthor: { type: String, default: '' } //推特作者

});


ContentSchema.set('toJSON', { getters: true, virtuals: true });
ContentSchema.set('toObject', { getters: true, virtuals: true });

ContentSchema.path('date').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});
ContentSchema.path('updateDate').get(function (v) {
    return moment(v).format("YYYY-MM-DD");
});

var Content = mongoose.model("Content", ContentSchema);

module.exports = Content;

