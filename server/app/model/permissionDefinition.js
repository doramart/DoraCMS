'use strict';

const shortid = require('shortid');

module.exports = app => {
  const { mongoose } = app;
  const { Schema } = mongoose;

  const PermissionDefinitionSchema = new Schema(
    {
      _id: {
        type: String,
        default: shortid.generate,
      },
      code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      method: {
        type: String,
        default: 'GET',
        uppercase: true,
        trim: true,
      },
      path: {
        type: String,
        required: true,
        trim: true,
      },
      desc: {
        type: String,
        default: '',
      },
      group: {
        type: String,
        default: 'default',
      },
      resourceType: {
        type: String,
        default: 'api', // api | event | task
      },
      scope: {
        type: String,
        default: 'global',
      },
      status: {
        type: String,
        default: 'enabled', // enabled | disabled
        index: true,
      },
      aliases: {
        type: [String],
        default: [],
      },
      meta: {
        type: Schema.Types.Mixed,
        default: {},
      },
      tags: {
        type: [String],
        default: [],
      },
      version: {
        type: Number,
        default: 1,
      },
      revision: {
        type: Number,
        default: 1,
      },
      hash: {
        type: String,
      },
      createdBy: {
        type: String,
        default: 'system',
      },
      updatedBy: {
        type: String,
        default: 'system',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      minimize: false,
    }
  );

  PermissionDefinitionSchema.index({ code: 1 }, { unique: true });
  PermissionDefinitionSchema.index({ method: 1, path: 1 });
  PermissionDefinitionSchema.index({ status: 1, group: 1 });

  return mongoose.model('PermissionDefinition', PermissionDefinitionSchema, 'permission_definitions');
};
