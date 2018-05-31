const mongoose = require('mongoose');
const isProd = process.env.NODE_ENV === 'production'
const settings = require('../../../configs/settings');

if (!isProd) {
    mongoose.connect("mongodb://localhost/" + settings.DB, { useMongoClient: true });
} else {
    mongoose.connect('mongodb://' + settings.USERNAME + ':' + settings.PASSWORD + '@' + settings.HOST + ':' + settings.PORT + '/' + settings.DB + '', { useMongoClient: true });
}

mongoose.Promise = global.Promise;
const db = mongoose.connection;

db.once('open', () => {
    console.log('connect mongodb success')
})

db.on('error', function (error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});

db.on('close', function () {
    console.log('数据库断开，重新连接数据库');
});


exports.AdminUser = require('./AdminUser');
exports.User = require('./User');
exports.AdminGroup = require('./AdminGroup');
exports.AdminResource = require('./AdminResource');
exports.ContentCategory = require('./ContentCategory');
exports.Content = require('./Content');
exports.ContentTag = require('./ContentTag');
exports.Message = require('./Message');
exports.UserNotify = require('./UserNotify');
exports.Notify = require('./Notify');
exports.SystemConfig = require('./SystemConfig');
exports.DataOptionLog = require('./DataOptionLog');
exports.SystemOptionLog = require('./SystemOptionLog');
exports.Ads = require('./Ads');
exports.AdsItems = require('./AdsItems');
exports.ContentTemplate = require('./ContentTemplate');
exports.TemplateItems = require('./TemplateItems');