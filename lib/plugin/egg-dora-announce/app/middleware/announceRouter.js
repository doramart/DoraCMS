'use strict';
const _ = require('lodash');
const announceAdminController = require('../controller/manage/announce');

module.exports = (options, app) => {
  return async function announceRouter(ctx, next) {
    const pluginConfig = app.config.doraAnnounce;
    await app.initPluginRouter(ctx, pluginConfig, announceAdminController);
    await next();
  };
};
