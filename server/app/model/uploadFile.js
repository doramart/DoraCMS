'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const path = require('path');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const UploadFileSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    type: {
      type: String,
      emun: ['local', 'qn', 'oss'],
    }, // 上传方式
    uploadPath: String, // 本地上传路径
    qn_bucket: String,
    qn_accessKey: String,
    qn_secretKey: String,
    qn_zone: String,
    qn_endPoint: String,
    oss_bucket: String,
    oss_accessKey: String,
    oss_secretKey: String,
    oss_region: String,
    oss_endPoint: String,
    oss_apiVersion: String,
  });

  UploadFileSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  UploadFileSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  UploadFileSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });
  UploadFileSchema.path('updatedAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('UploadFile', UploadFileSchema, 'upload_files');
};
