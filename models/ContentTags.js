/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;


var ContentTagsSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    alias : String, //别名
    date: { type: Date, default: Date.now },
    comments : String
});


var ContentTags = mongoose.model("ContentTags",ContentTagsSchema);

module.exports = ContentTags;

