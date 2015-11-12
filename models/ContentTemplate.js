/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;


var ContentTemplateSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    alias : { type: String , default: "defaultTemp" }, //别名 指向模板文件夹
    indexName: { type: String , default: "index" }, // 模板类型 大类首页
    cateName: { type: String , default: "contentList" }, // 模板类型 大类列表
    detailName: { type: String , default: "detail" }, // 模板类型 内容详情
    date: { type: Date, default: Date.now },
    comments : String
});

var ContentTemplate = mongoose.model("ContentTemplate",ContentTemplateSchema);

module.exports = ContentTemplate;

