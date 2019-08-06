const settings = require('@configs/settings');
let currentCache = settings.openRedis ? 'cache' : 'memoryCache';

exports.siteFunc = require('./siteFunc');
exports.cache = require('./' + currentCache);
exports.service = require('./service');
exports.validators = require('./validators');
exports.validatorUtil = require('./validatorUtil');
exports.logUtil = require('./logUtil');
exports.authToken = require('./authToken');
exports.mime = require('./mime');