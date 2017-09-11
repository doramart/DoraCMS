/**
 * Created by Administrator on 2015/4/15.
 * 管理员用户组对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

//mongoose.connect("mongodb://localhost/doracms")

var AdminGroupSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    power : String,
    date: { type: Date, default: Date.now },
    comments : String
});


var AdminGroup = mongoose.model("AdminGroup",AdminGroupSchema);

module.exports = AdminGroup;

