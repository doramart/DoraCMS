/*
 * @Author: AI Assistant
 * @Date: 2023-06-20
 * @Description: Validation rules for contentMessage
 */
'use strict';

module.exports = {
  form: ctx => {
    return {
      content: {
        type: 'string',
        required: true,
        min: 5,
        max: 200,
        message: ctx.__('validation.rangelength', [ctx.__('contentMessage.fields.content'), 5, 200]),
      },
    };
  },
};
