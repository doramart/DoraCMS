/*
 * @Author: AI Assistant
 * @Date: 2023-06-20
 * @Description: Validation rules for content
 */
'use strict';

module.exports = {
  form: ctx => {
    return {
      title: {
        type: 'string',
        required: true,
        min: 2,
        max: 100,
        message: ctx.__('validation.errorField', [ctx.__('content.fields.title')]),
      },
      stitle: {
        type: 'string',
        required: true,
        min: 2,
        max: 50,
        message: ctx.__('validation.errorField', [ctx.__('content.fields.stitle')]),
      },
      sImg: {
        type: 'string',
        required: true,
        message: ctx.__('validation.errorField', [ctx.__('content.fields.thumbnail')]),
      },
      discription: {
        type: 'string',
        required: true,
        min: 3,
        max: 300,
        message: ctx.__('validation.errorField', [ctx.__('content.fields.description')]),
      },
      comments: {
        type: 'string',
        required: true,
        min: 5,
        max: 100000,
        message: ctx.__('validation.inputCorrect', [ctx.__('content.fields.comments')]),
      },
    };
  },
};
