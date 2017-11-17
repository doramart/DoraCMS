// 导入DB数据
require('shelljs/global');

const setting = require("../utils/settings");

const name = "DoraDbData";
const time = ".20171117";
if(setting.HOST.match(/127.0.0.1|localhost/)){
    exec(`mongorestore  --gzip --archive=./data/${name + time}.gz `).stdout;
}else{
    exec(`mongorestore -h ${setting.HOST} --port ${setting.PORT} -u ${setting.USERNAME} -p ${setting.PASSWORD}  --gzip --archive=./data/${name + time}.gz `).stdout;
}
