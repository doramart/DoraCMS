/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-25 14:27:45
 */


const {
    userService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let userlist = await userService.find(payload);

        renderSuccess(req, res, {
            data: userlist
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.getOne = async (req, res, next) => {
    try {
        let _id = req.query.id;

        let targetUser = await userService.item(res, {
            query: {
                _id: _id
            }
        });

        renderSuccess(req, res, {
            data: targetUser
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }

}


exports.update = async (req, res, next) => {

    try {
        let fields = req.body || {};
        let errInfo = validateForm(res, 'user', {
            userName: fields.userName,
            email: fields.email,
            phoneNum: fields.phoneNum,
        })

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        const userObj = {};

        if (fields.enable != 'undefined' && fields.enable != undefined) {
            userObj.enable = fields.enable;
        }
        if (fields.userName) {
            userObj.userName = fields.userName;
        }
        if (fields.name) {
            userObj.name = fields.name;
        }
        if (fields.gender) {
            userObj.gender = fields.gender;
        }

        if (fields.logo) {
            userObj.logo = fields.logo;
        }

        if (fields.confirm) {
            userObj.confirm = fields.confirm;
        }
        if (fields.group) {
            userObj.group = fields.group;
        }
        if (fields.category) {
            userObj.category = fields.category;
        }
        if (fields.comments) {
            userObj.comments = xss(fields.comments);
        }
        if (fields.introduction) {
            userObj.introduction = xss(fields.introduction);
        }
        if (fields.company) {
            userObj.company = fields.company;
        }
        if (fields.province) {
            userObj.province = fields.province;
        }
        if (fields.city) {
            userObj.city = fields.city;
        }
        if (fields.birth) {
            // 生日日期不能大于当前时间
            if (new Date(fields.birth).getTime() > new Date().getTime()) {
                throw new Error(res.__('validate_error_params'));
            }
            userObj.birth = fields.birth;
        }
        if (fields.industry) {
            userObj.industry = xss(fields.industry);
        }
        if (fields.profession) {
            userObj.profession = xss(fields.profession);
        }
        if (fields.experience) {
            userObj.experience = xss(fields.experience);
        }
        if (fields.password) {
            userObj.password = service.encrypt(fields.password, settings.encrypt_key);
        }

        // console.log('--userObj--', userObj)
        await userService.update(res, fields._id, userObj);

        renderSuccess(req, res);


    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}


exports.removes = async (req, res, next) => {
    try {

        let targetIds = req.query.ids;
        await userService.safeDelete(req, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}