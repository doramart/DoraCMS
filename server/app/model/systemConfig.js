/**
 * Created by Administrator on 2015/4/15.
 * 数据操作记录
 */
'use strict';
const moment = require('moment');
module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const CryptoJS = require('crypto-js');

  const SystemConfigSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
    },
    type: {
      type: String,
      required: true,
      enum: ['string', 'number', 'boolean', 'password'],
    },
    public: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  });

  // // 保存前的钩子，处理类型转换
  // SystemConfigSchema.pre('save', function (next) {
  //   const doc = this;
  //   const value = doc.value;
  //   const type = doc.type;
  //   console.log('🚀 ~ type:', type);

  //   if (type === 'boolean') {
  //     doc.value = value === true || value === 'true' ? 'true' : 'false';
  //   } else if (type === 'number') {
  //     doc.value = String(value);
  //   } else if (type === 'password') {
  //     doc.value = CryptoJS.AES.encrypt(value, app.config.encrypt_key).toString();
  //   } else if (typeof value === 'object') {
  //     doc.value = JSON.stringify(value);
  //   }

  //   next();
  // });

  // 查询后的钩子，处理类型转换
  SystemConfigSchema.post('find', function (docs) {
    docs.forEach(doc => {
      if (doc.type === 'boolean') {
        doc.value = doc.value === 'true' || doc.value === true;
      } else if (doc.type === 'number') {
        doc.value = Number(doc.value);
      } else if (doc.type === 'password') {
        // doc.value = '********';
      }
    });
  });

  SystemConfigSchema.post('findOne', function (doc) {
    if (doc) {
      if (doc.type === 'boolean') {
        doc.value = doc.value === 'true' || doc.value === true;
      } else if (doc.type === 'number') {
        doc.value = Number(doc.value);
      } else if (doc.type === 'password') {
        // doc.value = '********';
      }
    }
  });

  SystemConfigSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  SystemConfigSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  SystemConfigSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  SystemConfigSchema.path('updatedAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('SystemConfig', SystemConfigSchema, 'system_configs');
};
