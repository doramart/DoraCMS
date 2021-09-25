'use strict';
const _ = require('lodash');
const templateConfigManageController = require('../controller/manage/templateConfig');

module.exports = (options, app) => {
  return async function templateConfigRouter(ctx, next) {
    const pluginConfig = app.config.doraTemplateConfig;
    await app.initPluginRouter(
      ctx,
      pluginConfig,
      templateConfigManageController
    );
    await next();
  };
};
