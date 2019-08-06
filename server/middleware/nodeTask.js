/**
 * 系统启动任务
 */
const {
    systemConfigService
} = require('@service');
const {
    SystemConfigController
} = require('../../server/lib/controller/manage');
const {
    logUtil
} = require('@utils');
const _ = require('lodash');
module.exports = async () => {
    try {
        let systemConfigs = await systemConfigService.find({
            isPaging: '0'
        }, {
            files: 'bakDatabyTime bakDataRate'
        });
        if (!_.isEmpty(systemConfigs)) {
            let currentConfig = systemConfigs[0];
            // 定时备份数据
            if (currentConfig.bakDatabyTime) {
                await SystemConfigController.addBakDataTask({}, {}, currentConfig.bakDataRate);
            }
        }
    } catch (error) {
        logUtil.error(error, {});
    }
}