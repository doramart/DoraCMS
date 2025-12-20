/*
 * @Author: AI Assistant
 * @Date: 2023-06-20
 * @Description: Validation rules for uploadFile
 */
'use strict';

module.exports = {
  form: ctx => {
    return {
      type: {
        type: 'string',
        required: true,
        message: ctx.__('validation.errorField', ['上传方式']),
      },
    };
  },
};
