/*
 * @Author: doramart
 * @Date: 2019-08-15 10:52:18
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 21:24:06
 */

'use strict';
const form = (ctx) => {
  return {
    siteEmailServer: {
      type: 'string',
      required: true,
      message: 'invite email server',
    },
    siteEmail: {
      type: 'email',
      required: true,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_user_email')]),
    },
    siteName: {
      type: 'string',
      required: true,
      min: 5,
      max: 100,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_sysconfig_site_name'),
      ]),
    },
    siteDiscription: {
      type: 'string',
      required: true,
      min: 5,
      max: 200,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_sysconfig_site_dis'),
      ]),
    },
    siteKeywords: {
      type: 'string',
      required: true,
      min: 5,
      max: 100,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_sysconfig_site_keyWords'),
      ]),
    },
    siteAltKeywords: {
      type: 'string',
      required: true,
      min: 5,
      max: 100,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_sysconfig_site_tags'),
      ]),
    },
    registrationNo: {
      type: 'string',
      required: true,
      min: 5,
      max: 30,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_sysconfig_site_icp'),
      ]),
    },
    mongodbInstallPath: {
      type: 'string',
      required: true,
      min: 5,
      max: 300,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_sysconfig_mongoPath'),
      ]),
    },
    databackForderPath: {
      type: 'string',
      required: true,
      min: 5,
      max: 300,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_sysconfig_databakPath'),
      ]),
    },
  };
};

module.exports = {
  form,
};
