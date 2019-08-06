/*
 * @Author: doramart 
 * @Date: 2019-07-07 13:07:27 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-08 14:39:55
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
    adsService
} = require('@service');


exports.getOne = async (req, res, next) => {
    try {
        let name = req.query.name;

        let targetItem = await adsService.item(res, {
            query: {
                name: name,
                state: true
            },
            populate: [{
                path: 'items'
            }]
        });

        renderSuccess(req, res, {
            data: targetItem
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }

}