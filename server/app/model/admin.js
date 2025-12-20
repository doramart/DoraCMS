const shortid = require('shortid');
const moment = require('moment');
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  require('./role');
  const AdminSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    userName: { type: String, required: true },
    password: {
      type: String,
      // 🔥 密码加密已在 Repository 层的 _customPreprocessForCreate 和 _customPreprocessForUpdate 中处理
      // 移除此处的 setter 以避免重复加密
    },
    logo: {
      type: String,
      required: true,
      default: 'https://cdn.html-js.cn/cms/upload/images/20250601/1748746558512977961.png',
    },
    userGender: { type: String, required: true, enum: ['1', '2'] }, // 1: male, 2: female
    nickName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String, required: true },
    userRoles: { type: [String], default: [], ref: 'Role' },
    status: { type: String, required: true, enum: ['1', '2'] }, // 1: enabled, 2: disabled
    createBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    updateBy: { type: String },
    updatedAt: { type: Date, default: Date.now },
  });

  AdminSchema.path('createdAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  AdminSchema.path('updatedAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  return mongoose.model('Admin', AdminSchema, 'admins');
};
