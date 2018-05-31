/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var moment = require('moment')


var ContentTagSchema = new Schema({
    _id: {
        type: String,

        'default': shortid.generate
    },
    name: String,
    alias: String, //别名
    date: { type: Date, default: Date.now },
    comments: String
});

ContentTagSchema.set('toJSON', { getters: true, virtuals: true });
ContentTagSchema.set('toObject', { getters: true, virtuals: true });

ContentTagSchema.path('date').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});

var ContentTag = mongoose.model("ContentTag", ContentTagSchema);

module.exports = ContentTag;

