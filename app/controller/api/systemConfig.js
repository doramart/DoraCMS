/*
 * @Author: doramart 
 * @Date: 2019-07-07 13:07:27 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-02-13 12:34:27
 */
const Controller = require('egg').Controller;


class SystemConfigController extends Controller {

    async list() {
        const ctx = this.ctx;
        let systemConfigList = await ctx.service.systemConfig.find({
            isPaging: '0'
        }, {
            files: 'siteName ogTitle siteDomain siteDiscription siteKeywords siteAltKeywords registrationNo showImgCode statisticalCode siteLogo'
        });
        ctx.helper.renderSuccess(ctx, {
            data: systemConfigList[0]
        });
    }

}

module.exports = SystemConfigController;