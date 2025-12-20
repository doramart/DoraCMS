/*
 * @Author: AI Assistant
 * @Date: 2023-06-20
 * @Description: Validation rules for regUser
 */
'use strict';

module.exports = {
  form: ctx => {
    return {
      userName: {
        type: 'string',
        required: true,
        min: 2,
        max: 30,
        message: ctx.__('validation.errorField', [ctx.__('user.profile.basic.username')]),
      },
      email: {
        type: 'email',
        required: true,
        message: ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.email')]),
      },
      phoneNum: {
        type: 'string',
        required: true,
        message: ctx => ctx.__('validation.user.phoneNum.invalid'),
      },
    };
  },
};
