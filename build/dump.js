// 备份DB数据
require('shelljs/global');
const setting = require("../utils/settings");

const moment = require("moment");
const time = moment().format("YYYYMMDD-HHmmss");


if(setting.HOST.match(/127.0.0.1|localhost/)){
    exec(`mongodump --gzip --archive=./data/DoraDbData.${time}.gz --db ${setting.DB} `).stdout;
}else{
    exec(`mongodump --gzip -h ${setting.HOST} --port ${setting.PORT} -u ${setting.USERNAME} -p ${setting.PASSWORD}  --archive=./data/DoraDbData.${time}.gz --db ${setting.DB} `).stdout;
}