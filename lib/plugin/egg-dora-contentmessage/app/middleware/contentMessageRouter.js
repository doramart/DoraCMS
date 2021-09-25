'use strict';
const _ = require('lodash');
const contentMessageAdminController = require('../controller/manage/contentMessage');
const contentMessageApiController = require('../controller/api/contentMessage');

module.exports = (options, app) => {
  return async function contentMessageRouter(ctx, next) {
    const pluginConfig = app.config.doraContentMessage;
    await app.initPluginRouter(
      ctx,
      pluginConfig,
      contentMessageAdminController,
      contentMessageApiController
    );
    await next();
  };
};
