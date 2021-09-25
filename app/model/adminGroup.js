/**
 * Created by Administrator on 2015/4/15.
 * 管理员用户组对象
 */
'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  require('./adminResource');

  const AdminGroupSchema = new Schema({
    _id: {
      type: String,

      default: shortid.generate,
    },
    name: String,
    power: [
      {
        type: String,
        ref: 'AdminResource',
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    comments: String,
  });

  return mongoose.model('AdminGroup', AdminGroupSchema, 'admingroups');
};
