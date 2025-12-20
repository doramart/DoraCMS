/*
 * @Author: AI Assistant
 * @Date: 2023-06-20
 * @Description: Validation rules for contentTag
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
        message: ctx.__('validation.errorField', [ctx.__('contentTag.fields.name')]),
      },
      comments: {
        type: 'string',
        required: true,
        min: 2,
        max: 30,
        message: ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.comments')]),
      },
    };
  },
};
