/**
 * Template 模板主题验证规则
 */
'use strict';

const templateRule = {
  // 创建模板主题
  addOne: {
    name: {
      type: 'string',
      required: true,
      min: 1,
      max: 100,
      message: ctx => ctx.__('validation.template.name.length'),
    },
    slug: {
      type: 'string',
      required: true,
      min: 1,
      max: 50,
      format: /^[a-zA-Z0-9-_]+$/,
      message: ctx => ctx.__('validation.template.slug.format'),
    },
    version: {
      type: 'string',
      required: false,
      format: /^\d+\.\d+\.\d+$/,
      message: ctx => ctx.__('validation.template.version.format'),
    },
    author: {
      type: 'string',
      required: false,
      max: 100,
      message: ctx => ctx.__('validation.template.author.max'),
    },
    description: {
      type: 'string',
      required: false,
      max: 500,
      message: ctx => ctx.__('validation.template.description.max'),
    },
    screenshot: {
      type: 'string',
      required: false,
      max: 255,
      message: ctx => ctx.__('validation.template.screenshot.max'),
    },
    config: {
      type: 'object',
      required: false,
      message: ctx => ctx.__('validation.template.config.invalid'),
    },
  },

  // 更新模板主题
  updateOne: {
    name: {
      type: 'string',
      required: false,
      min: 1,
      max: 100,
      message: ctx => ctx.__('validation.template.name.length'),
    },
    slug: {
      type: 'string',
      required: false,
      min: 1,
      max: 50,
      format: /^[a-zA-Z0-9-_]+$/,
      message: ctx => ctx.__('validation.template.slug.format'),
    },
    version: {
      type: 'string',
      required: false,
      format: /^\d+\.\d+\.\d+$/,
      message: ctx => ctx.__('validation.template.version.format'),
    },
    author: {
      type: 'string',
      required: false,
      max: 100,
      message: ctx => ctx.__('validation.template.author.max'),
    },
    description: {
      type: 'string',
      required: false,
      max: 500,
      message: ctx => ctx.__('validation.template.description.max'),
    },
    screenshot: {
      type: 'string',
      required: false,
      max: 255,
      message: ctx => ctx.__('validation.template.screenshot.max'),
    },
    config: {
      type: 'object',
      required: false,
      message: ctx => ctx.__('validation.template.config.invalid'),
    },
    active: {
      type: 'boolean',
      required: false,
      message: ctx => ctx.__('validation.template.active.invalid'),
    },
    installed: {
      type: 'boolean',
      required: false,
      message: ctx => ctx.__('validation.template.installed.invalid'),
    },
    status: {
      type: 'enum',
      values: ['0', '1'],
      required: false,
      message: ctx => ctx.__('validation.template.status.enum'),
    },
  },

  // 批量删除
  deleteMany: {
    ids: {
      type: 'array',
      required: true,
      itemType: 'string',
      min: 1,
      message: ctx => ctx.__('validation.template.ids.deleteRequired'),
    },
  },

  // 安装主题
  install: {
    name: {
      type: 'string',
      required: true,
      min: 1,
      max: 100,
      message: ctx => ctx.__('validation.template.name.length'),
    },
    slug: {
      type: 'string',
      required: true,
      min: 1,
      max: 50,
      format: /^[a-zA-Z0-9-_]+$/,
      message: ctx => ctx.__('validation.template.slug.format'),
    },
    version: {
      type: 'string',
      required: false,
      format: /^\d+\.\d+\.\d+$/,
      message: ctx => ctx.__('validation.template.version.format'),
    },
  },

  // 更新统计信息
  updateStats: {
    downloadCount: {
      type: 'number',
      required: false,
      min: 0,
      message: ctx => ctx.__('validation.template.downloadCount.min'),
    },
    rating: {
      type: 'number',
      required: false,
      min: 0,
      max: 5,
      message: ctx => ctx.__('validation.template.rating.range'),
    },
    reviewCount: {
      type: 'number',
      required: false,
      min: 0,
      message: ctx => ctx.__('validation.template.reviewCount.min'),
    },
  },

  // 批量更新状态
  batchUpdateStatus: {
    ids: {
      type: 'array',
      required: true,
      itemType: 'string',
      min: 1,
      message: ctx => ctx.__('validation.template.ids.updateRequired'),
    },
    status: {
      type: 'enum',
      values: ['0', '1'],
      required: true,
      message: ctx => ctx.__('validation.template.status.enum'),
    },
  },
};

module.exports = {
  templateRule,
};
