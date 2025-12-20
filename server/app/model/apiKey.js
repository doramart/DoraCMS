const { Schema } = require('mongoose');
const moment = require('moment');
const shortid = require('shortid');

module.exports = app => {
  const mongoose = app.mongoose;
  const ApiKeySchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    userId: { type: String, ref: 'User', required: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    secret: { type: String, required: true },
    permissions: [
      {
        url: { type: String, required: true },
        method: { type: String, required: true },
        enabled: { type: Boolean, default: true },
      },
    ],
    ipWhitelist: [{ type: String }],
    rateLimit: {
      requests: { type: Number, default: 100 },
      period: { type: Number, default: 3600 }, // 1 hour in seconds
    },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    expiresAt: { type: Date },
    lastUsedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  // Add indexes
  ApiKeySchema.index({ userId: 1 });
  ApiKeySchema.index({ key: 1 }, { unique: true });
  ApiKeySchema.index({ status: 1 });
  ApiKeySchema.index({ expiresAt: 1 });

  ApiKeySchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  ApiKeySchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  ApiKeySchema.path('createdAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  ApiKeySchema.path('updatedAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  ApiKeySchema.path('expiresAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  ApiKeySchema.path('lastUsedAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });
  return mongoose.model('ApiKey', ApiKeySchema, 'api_keys');
};
