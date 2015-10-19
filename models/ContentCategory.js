/**
 * Created by Administrator on 2015/4/15.
 * 文章类别对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

//mongoose.connect("mongodb://localhost/doracms")

var contentCategory = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    uid : { type: Number, default: 0 },
    name:  String,
    keywords : String,
    sortId : { type: Number, default: 1 }, // 排序 正整数
    parentID : { type: String, default: "0" },
    state : { type: String, default: "1" },  //是否公开 默认公开
    date: { type: Date, default: Date.now },
    contentTemp : { type: String, default: "defaultTemp" }, // 内容模板
    defaultUrl : { type: String, default: "" }, // 父类别的默认目录
    homePage : { type: String, default: "ui" }, // 必须唯一
    sortPath : { type: String, default: "0" }, //存储所有父节点结构
    comments : String
});

var ContentCategory = mongoose.model("ContentCategory",contentCategory);

module.exports = ContentCategory;

