/**
 * Created by Administrator on 2015/4/15.
 * 数据操作记录
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;


var DataOptionLogSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    date: { type: Date, default: Date.now },
    fileName : { type : String },
    path : { type : String },
    logs : String
});

var DataOptionLog = mongoose.model("DataOptionLog",DataOptionLogSchema);

module.exports = DataOptionLog;

