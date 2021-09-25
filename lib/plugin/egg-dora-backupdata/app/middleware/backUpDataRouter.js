'use strict';
const _ = require('lodash');
const backUpDataAdminController = require('../controller/manage/backUpData');

module.exports = (options, app) => {
  return async function backUpDataRouter(ctx, next) {
    const pluginConfig = app.config.doraBackUpData;
    await app.initPluginRouter(ctx, pluginConfig, backUpDataAdminController);
    await next();
  };
};
