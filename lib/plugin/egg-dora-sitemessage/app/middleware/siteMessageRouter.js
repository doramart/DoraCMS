'use strict';
const _ = require('lodash');
const siteMessageAdminController = require('../controller/manage/siteMessage');
const siteMessageApiController = require('../controller/api/siteMessage');

module.exports = (options, app) => {
  return async function siteMessageRouter(ctx, next) {
    const pluginConfig = app.config.doraSiteMessage;
    await app.initPluginRouter(
      ctx,
      pluginConfig,
      siteMessageAdminController,
      siteMessageApiController
    );
    await next();
  };
};
