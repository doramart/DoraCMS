module.exports = app => {
    const mongoose = app.mongoose
    var shortid = require('shortid');
    var path = require('path');
    var Schema = mongoose.Schema;
    var moment = require('moment')

    var HookSchema = new Schema({
        _id: {
            type: String,
            'default': shortid.generate
        },
        createTime: {
            type: Date,
        },
        updateTime: {
            type: Date,
        },
        name: String, // 名称 
        description: String, // 描述 
        type: {
            type: String,
            default: '1'
        }, // 类型 
        ext: String, // 钩子挂载的插件 
        status: String, // 状态 

    });

    HookSchema.set('toJSON', {
        getters: true,
        virtuals: true
    });
    HookSchema.set('toObject', {
        getters: true,
        virtuals: true
    });

    HookSchema.path('createTime').get(function (v) {
        return moment(v).format("YYYY-MM-DD HH:mm:ss");
    });
    HookSchema.path('updateTime').get(function (v) {
        return moment(v).format("YYYY-MM-DD HH:mm:ss");
    });

    return mongoose.model("Hook", HookSchema, 'hooks');

}