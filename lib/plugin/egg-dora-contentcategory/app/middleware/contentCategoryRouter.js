'use strict';
const _ = require('lodash');
const contentCategoryAdminController = require('../controller/manage/contentCategory');
const contentCategoryApiController = require('../controller/api/contentCategory');

module.exports = (options, app) => {
  return async function contentCategoryRouter(ctx, next) {
    const pluginConfig = app.config.doraContentCategory;
    await app.initPluginRouter(
      ctx,
      pluginConfig,
      contentCategoryAdminController,
      contentCategoryApiController
    );
    await next();
  };
};
