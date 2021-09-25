/*
 * @Author: doramart
 * @Date: 2019-08-15 10:51:41
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 22:00:19
 */
'use strict';
const form = (ctx) => {
  return {
    userName: {
      type: 'string',
      required: true,
      min: 5,
      max: 12,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_user_userName')]),
    },
    name: {
      type: 'string',
      required: true,
      min: 2,
      max: 6,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_name')]),
    },
    email: {
      type: 'email',
      required: true,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_user_email')]),
    },
    phoneNum: {
      type: 'string',
      required: true,
      // len: 11,
      message: 'invalid phoneNum',
    },
    countryCode: {
      type: 'string',
      required: true,
    },
    comments: {
      type: 'string',
      required: true,
      min: 5,
      max: 30,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_comments')]),
    },
  };
};

const login = (ctx) => {
  return {
    userName: {
      type: 'string',
      required: true,
      min: 2,
      max: 30,
      // pattern: /^[a-z]+$/,
      message: ctx.__('validate_error_field', [ctx.__('label_user_userName')]),
    },
    password: {
      type: 'string',
      required: true,
    },
  };
};

module.exports = {
  form,
  login,
};
