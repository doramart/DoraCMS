const _ = require('lodash');
const mailTemplateAdminController = require('../controller/manage/mailTemplate')
const mailTemplateApiController = require('../controller/api/mailTemplate')

module.exports = (options, app) => {

    return async function mailTemplateRouter(ctx, next) {

        let pluginConfig = app.config.doraMailTemplate;
        await app.initPluginRouter(ctx, pluginConfig, mailTemplateAdminController, mailTemplateApiController);
        await next();

    }

}