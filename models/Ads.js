/**
 * Created by Administrator on 2015/4/15.
 * 广告管理
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var AdsSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    mkey : String, //广告位标识
    title:  String,
    category:  String, // friendlink表示友情链接，默认default为广告
    state : { type: String, default: "1" }, // 广告状态，是否显示
    type: { type: String, default: "0" }, // 展示形式 0文字 1图片
    date: { type: Date, default: Date.now },
    content: String // 内容
});

var Ads = mongoose.model("Ads",AdsSchema);

module.exports = Ads;

