/**
 * Created by Administrator on 2015/4/15.
 * 数据操作记录
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var moment = require('moment')

var DataOptionLogSchema = new Schema({
    _id: {
        type: String,
        
        'default': shortid.generate
    },
    date: { type: Date, default: Date.now },
    fileName : { type : String },
    path : { type : String },
    logs : String
});

DataOptionLogSchema.set('toJSON', { getters: true, virtuals: true });
DataOptionLogSchema.set('toObject', { getters: true, virtuals: true });

DataOptionLogSchema.path('date').get(function (v) {
    return moment(v).format("YYYY-MM-DD HH:mm:ss");
});

var DataOptionLog = mongoose.model("DataOptionLog",DataOptionLogSchema);

module.exports = DataOptionLog;

