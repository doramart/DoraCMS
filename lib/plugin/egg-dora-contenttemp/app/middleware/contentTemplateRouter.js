const _ = require('lodash');
const contentTemplateManageController = require('../controller/manage/contentTemplate')
const contentTemplateApiController = require('../controller/api/contentTemplate')

module.exports = (options, app) => {

    return async function contentTemplateRouter(ctx, next) {

        let pluginConfig = app.config.doraContentTemp;
        await app.initPluginRouter(ctx, pluginConfig, contentTemplateManageController, contentTemplateApiController);
        await next();

    }

}