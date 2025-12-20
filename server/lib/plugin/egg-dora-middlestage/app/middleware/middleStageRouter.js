'use strict';
// const _ = require('lodash');

const doraMiddleStageAdminController = require('../controller/manage/middleStage');
const doraMiddleStageApiController = require('../controller/api/middleStage');

module.exports = (options, app) => {
  return async function doraMiddleStageRouter(ctx, next) {
    const pluginConfig = app.config.doraMiddleStage;
    await app.initPluginRouter(ctx, pluginConfig, doraMiddleStageAdminController, doraMiddleStageApiController);
    await next();
  };
};
