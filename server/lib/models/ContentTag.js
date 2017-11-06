/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;


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


var ContentTag = mongoose.model("ContentTag", ContentTagSchema);

module.exports = ContentTag;

