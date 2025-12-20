/*
 * @Author: AI Assistant
 * @Date: 2023-06-20
 * @Description: Validation rules for contentCategory
 */
'use strict';

module.exports = {
  form: ctx => {
    return {
      name: {
        type: 'string',
        required: true,
        min: 2,
        max: 20,
        message: ctx.__('validation.errorField', [ctx.__('contentCategory.fields.name')]),
      },
      defaultUrl: {
        type: 'string',
        required: true,
        message: ctx.__('validation.errorField', [ctx.__('contentCategory.fields.defaultUrl')]),
      },
      comments: {
        type: 'string',
        required: true,
        min: 4,
        max: 100,
        message: ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.comments')]),
      },
    };
  },
};
