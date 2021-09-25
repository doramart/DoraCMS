'use strict';
const _ = require('lodash');
const contentTagAdminController = require('../controller/manage/contentTag');
const contentTagApiController = require('../controller/api/contentTag');

module.exports = (options, app) => {
  return async function contentTagRouter(ctx, next) {
    const pluginConfig = app.config.doraContentTags;
    await app.initPluginRouter(
      ctx,
      pluginConfig,
      contentTagAdminController,
      contentTagApiController
    );
    await next();
  };
};
