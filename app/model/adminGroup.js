/**
 * Created by Administrator on 2015/4/15.
 * 管理员用户组对象
 */
module.exports = app => {
    const mongoose = app.mongoose
    var shortid = require('shortid');
    var Schema = mongoose.Schema;
    require('./adminResource');

    var AdminGroupSchema = new Schema({
        _id: {
            type: String,

            'default': shortid.generate
        },
        name: String,
        power: [{
            type: String,
            ref: "AdminResource"
        }],
        date: {
            type: Date,
            default: Date.now
        },
        comments: String
    });


    return mongoose.model("AdminGroup", AdminGroupSchema, 'admingroups');

}