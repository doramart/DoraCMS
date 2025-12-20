/*
 * @Author: AI Assistant
 * @Date: 2023-06-20
 * @Description: Validation rules for templateConfig
 */
'use strict';

module.exports = {
  form: ctx => {
    return {
      name: {
        type: 'string',
        required: true,
        min: 1,
        max: 12,
        message: ctx.__('validation.errorField', [ctx.__('templateConfig.fields.name')]),
      },
      forder: {
        type: 'string',
        required: true,
        min: 1,
        max: 30,
        message: ctx.__('validation.errorField', [ctx.__('templateConfig.fields.forder')]),
      },
      comments: {
        type: 'string',
        required: true,
        min: 2,
        max: 30,
        message: ctx.__('validation.errorField', [ctx.__('user.profile.basic.comments')]),
      },
    };
  },
};
