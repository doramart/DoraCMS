/*
 * @Author: doramart 
 * @Date: 2019-07-07 13:07:27 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-08 14:05:33
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
    contentTagService
} = require('@service');


exports.list = async (req, res, next) => {
    try {

        let contentTagList = await contentTagService.find({
            isPaging: '0'
        });

        renderSuccess(req, res, {
            data: contentTagList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}