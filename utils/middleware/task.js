/**
 * 系统启动任务
 */
const SystemConfigModel = require("../../server/lib/models").SystemConfig;
const { SystemConfig } = require('../../server/lib/controller');
const logUtil = require('./logUtil');
const _ = require('lodash');
module.exports = async () => {
    try {
        const systemConfigs = await SystemConfigModel.find({});
        if (!_.isEmpty(systemConfigs)) {
            let currentConfig = systemConfigs[0];
            // 定时备份数据
            if (currentConfig.bakDatabyTime) {
                await SystemConfig.addBakDataTask({}, {}, currentConfig.bakDataRate);
            }
        }
    } catch (error) {
        logUtil.error(error, {});
    }
}