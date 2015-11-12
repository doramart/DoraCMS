/**
 * Created by Administrator on 2015/9/28.
 * 系统操作日志
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;


var SystemOptionLogSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    type : String,
    date: { type: Date, default: Date.now },
    logs : String
});

var SystemOptionLog = mongoose.model("SystemOptionLog",SystemOptionLogSchema);

module.exports = SystemOptionLog;

