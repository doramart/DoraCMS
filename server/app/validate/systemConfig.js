/*
 * @Author: doramart
 * @Date: 2019-08-15 10:52:18
 * @Last Modified by: doramart
 * @Last Modified time: 2025-09-14 10:35:48
 */

'use strict';

const form = ctx => {
  return {
    key: {
      type: 'string',
      required: true,
      message: ctx.__('validation.inputCorrect', [ctx.__('system.config.key')]),
    },
    // value: {
    //   type: 'any',
    //   required: true,
    //   message: ctx.__('validation.inputCorrect', [ctx.__('system.config.value')]),
    // },
    type: {
      type: 'string',
      required: true,
      enum: ['string', 'number', 'boolean', 'password'],
      message: ctx.__('validation.inputCorrect', [ctx.__('system.config.type')]),
    },
  };
};

const update = ctx => {
  return {
    id: {
      type: 'databaseId',
      required: true,
      message: ctx.__('validation.errorParams'),
    },
    key: {
      type: 'string',
      required: true,
      message: ctx.__('validation.inputCorrect', [ctx.__('system.config.key')]),
    },
    // value: {
    //   type: 'any',
    //   required: true,
    //   message: ctx.__('validation.inputCorrect', [ctx.__('system.config.value')]),
    // },
    type: {
      type: 'string',
      required: true,
      enum: ['string', 'number', 'boolean'],
      message: ctx.__('validation.inputCorrect', [ctx.__('system.config.type')]),
    },
  };
};

const removes = {
  ids: {
    type: 'databaseId',
    required: true,
    message: ctx => ctx.__('validation.errorParams'),
  },
};

module.exports = {
  form,
  update,
  removes,
};
