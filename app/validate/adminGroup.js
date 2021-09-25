/*
 * @Author: doramart
 * @Date: 2019-08-15 10:47:37
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 22:00:13
 */

'use strict';
const form = (ctx) => {
  return {
    name: {
      type: 'string',
      required: true,
      min: 2,
      max: 50,
      message: ctx.__('validate_error_field', [ctx.__('label_name')]),
    },
    comments: {
      type: 'string',
      required: true,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_comments')]),
    },
  };
};

module.exports = {
  form,
};
