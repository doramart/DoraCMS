/*
 * @Author: doramart 
 * @Date: 2019-07-15 10:23:19 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-15 10:24:39
 */

const _ = require('lodash');
module.exports = async (req, res, next) => {

    if (!_.isEmpty(req.session.user)) {
        next()
    } else {
        res.redirect('/users/login');
    }

}