/*
 * @Author: doramart 
 * @Date: 2019-07-29 17:11:52 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-01 17:22:02
 */

exports.internationalization = require('./internationalization');
exports.nunjucksFilter = require('./nunjucksFilter');

// WEB_MIDDLEWARE_INDEX_BEGIN
exports.authPath = require('./authPath');
exports.authUserToken = require('./authUserToken');
exports.authSessionForPage = require('./authSessionForPage');
// WEB_MIDDLEWARE_INDEX_END

// API_MIDDLEWARE_INDEX_BEGIN
exports.authApiToken = require('./authApiToken');
exports.renderUserInfo = require('./renderUserInfo');
exports.crossHeader = require('./crossHeader');
exports.nodeTask = require('./nodeTask');
exports.authAdminPower = require('./authAdminPower');
exports.authAdminToken = require('./authAdminToken');
// API_MIDDLEWARE_INDEX_END

// BACKSTATE_MIDDLEWARE_INDEX_BEGIN
exports.authAdminPageToken = require('./authAdminPageToken');
// BACKSTATE_MIDDLEWARE_INDEX_END