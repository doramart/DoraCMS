/*
 * @Author: doramart 
 * @Date: 2019-07-07 13:07:27 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-08 14:33:10
 */



const xss = require("xss");
const shortid = require('shortid');
const validator = require('validator');

const {
    cache,
    siteFunc,
    validatorUtil
} = require('@utils');
const settings = require('@configs/settings');


const {
    systemConfigService
} = require('@service');


exports.config = async (req, res, next) => {
    try {

        let systemConfigList = await systemConfigService.find({
            isPaging: '0'
        }, {
            files: 'siteName ogTitle siteDomain siteDiscription siteKeywords siteAltKeywords registrationNo showImgCode'
        });

        renderSuccess(req, res, {
            data: systemConfigList[0]
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}