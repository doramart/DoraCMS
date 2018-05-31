// 导入DB数据
require('shelljs/global');
const moment = require('moment');
const setting = require("../configs/settings");

const dbforder = '20180531145629';

if (process.env.NODE_ENV == 'production') {
    exec(`mongorestore -d ${setting.DB} -h ${setting.HOST} --port ${setting.PORT} -u ${setting.USERNAME} -p ${setting.PASSWORD} --drop ./databak/${dbforder}/${setting.DB}`).stdout;
} else {
    exec(`mongorestore -h 127.0.0.1:27017 -d ${setting.DB} --drop ./databak/${dbforder}/${setting.DB}`).stdout;
}
