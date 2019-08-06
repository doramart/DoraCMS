/*
 * @Author: doramart 
 * @Date: 2019-07-24 23:31:06 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-25 10:59:35
 */

const {
    adminResourceService
} = require('@service')
const _ = require('lodash');
const routeWhiteList = require('./adminRouterWhiteList');
module.exports = async (req, res, next) => {

    try {
        let resouce = await adminResourceService.find({
            isPaging: '0'
        }, {
            query: {
                type: '1'
            },
            files: "_id api"
        });

        let hasPower = false;
        for (let i = 0; i < resouce.length; i++) {
            let resourceObj = resouce[i];

            let targetApi = (req.originalUrl).replace('/manage/', '').split("?")[0];
            if (!_.isEmpty(req.session.adminUserInfo)) {
                let adminPower = req.session.adminPower;
                if (resourceObj.api === targetApi && adminPower && adminPower.indexOf(resourceObj._id) > -1) {
                    hasPower = true;
                    break;
                } else {
                    // 没有配置但是包含在白名单内的路由校验
                    if (!_.isEmpty(routeWhiteList)) {
                        let checkWhiteRouter = _.filter(routeWhiteList, (item) => {
                            return item == targetApi;
                        })
                        if (!_.isEmpty(checkWhiteRouter)) {
                            hasPower = true;
                            break;
                        }
                    }
                }
            } else {
                break;
            }
        }
        if (!hasPower) {
            res.send({
                status: 500,
                message: res.__('label_systemnotice_nopower')
            });
        } else {
            next();
        }
    } catch (error) {
        res.send({
            status: 500,
            message: res.__('label_systemnotice_nopower')
        });
    }

}