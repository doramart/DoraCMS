// 备份DB数据
require('shelljs/global');
const settings = require("../configs/settings");
const isDev = process.env.NODE_ENV == 'development' ? true : false;
const moment = require("moment");


let databackforder = process.cwd() + '/databak/';

let dataPath = databackforder + moment().format('YYYYMMDDHHmmss').toString();;

let cmdstr = isDev ? 'mongodump -d ' + settings.DB + ' -o "' + dataPath + '"' : 'mongodump -u ' + settings.USERNAME + ' -p ' + settings.PASSWORD + ' -d ' + settings.DB + ' -o "' + dataPath + '"';

exec(cmdstr).stdout;

