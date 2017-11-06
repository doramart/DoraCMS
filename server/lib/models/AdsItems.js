/**
 * Created by Administrator on 2015/4/15.
 * 广告管理,广告单元
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var AdsItemsSchema = new Schema({
    _id: {
        type: String,
        
        'default': shortid.generate
    },

    title: String,
    link: String, // 广告链接
    width: Number,
    height: { type: Number, default: 1 },
    target: { type: String, default: '_blank' },
    sImg: String, // 图片路径
    date: { type: Date, default: Date.now },
    alt: String // 广告alt标识
});

var AdsItems = mongoose.model("AdsItems", AdsItemsSchema);

module.exports = AdsItems;

