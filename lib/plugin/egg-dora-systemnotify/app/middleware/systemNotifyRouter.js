'use strict';
const _ = require('lodash');
const systemNotifyAdminController = require('../controller/manage/systemNotify');
const systemNotifyApiController = require('../controller/api/systemNotify');

module.exports = (options, app) => {
  return async function systemNotifyRouter(ctx, next) {
    const pluginConfig = app.config.doraSystemNotify;
    await app.initPluginRouter(
      ctx,
      pluginConfig,
      systemNotifyAdminController,
      systemNotifyApiController
    );
    await next();
  };
};
