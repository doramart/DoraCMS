/*
 * @Author: AI Assistant
 * @Date: 2023-06-20
 * @Description: Validation rules for mailTemplate
 */
'use strict';

module.exports = {
  form: ctx => {
    return {
      comment: {
        type: 'string',
        required: true,
        message: ctx.__('validation.errorField', [ctx.__('mail.template.fields.comment')]),
      },
      title: {
        type: 'string',
        required: true,
        message: ctx.__('validation.errorField', [ctx.__('mail.template.fields.name')]),
      },
      content: {
        type: 'string',
        required: true,
        message: ctx.__('validation.errorField', [ctx.__('mail.template.fields.content')]),
      },
      type: {
        type: 'string',
        required: true,
        message: ctx.__('validation.errorField', [ctx.__('mail.template.fields.type')]),
      },
    };
  },
};
