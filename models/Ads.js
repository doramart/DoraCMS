/**
 * Created by Administrator on 2015/4/15.
 * 广告管理
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var AdsItems = require('./AdsItems');
var AdsSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    type: { type: String, default: "0" }, // 展示形式 0文字 1图片 2友情链接
    state : { type: String, default: "1" }, // 广告状态，是否显示
    date: { type: Date, default: Date.now },
    items: [{ type: String , ref: 'AdsItems' }] // 广告列表id
});



AdsSchema.statics = {

    getOneAds : function(res,targetId,callBack){
        if(shortid.isValid(targetId)){
            Ads.findOne({'_id' : targetId}).populate('items').exec(function(err,doc){
                if(err){
                    res.end(err);
                }
                callBack(doc);
            })
        }else{
            res.end('非法参数！');
        }
    }

};

var Ads = mongoose.model("Ads",AdsSchema);
module.exports = Ads;

