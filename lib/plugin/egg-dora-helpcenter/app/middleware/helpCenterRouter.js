const _ = require('lodash');
const helpCenterAdminController = require('../controller/manage/helpCenter')

module.exports = (options, app) => {

    return async function helpCenterRouter(ctx, next) {

        let pluginConfig = app.config.doraHelpCenter;
        await app.initPluginRouter(ctx, pluginConfig, helpCenterAdminController);
        await next();

    }

}