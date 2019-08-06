/**
 * Created by Administrator on 2015/4/15.
 * 子模板信息
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;


var TemplateItemsSchema = new Schema({
    _id: {
        type: String,
        'default': shortid.generate
    },
    name: String,
    forder: { type: String, default: "2-stage-default" }, //别名 指向模板文件夹
    cateName: { type: String, default: "contentList" }, // 模板类型 大类列表
    detailName: { type: String, default: "detail" }, // 模板类型 内容详情
    isDefault: { type: Boolean, default: false }, // 是否为默认模板
    date: { type: Date, default: Date.now },
    comment: String // 小类模板描述
});

TemplateItemsSchema.statics = {




};



var TemplateItems = mongoose.model("TemplateItems", TemplateItemsSchema);

module.exports = TemplateItems;

