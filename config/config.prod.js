'use strict';
const path = require('path');

module.exports = (appInfo) => {
  return {
    // 插件路径
    admin_root_path: '/static',
    // 数据库连接
    mongoose: {
      client: {
        url: 'mongodb://127.0.0.1:27017/doracms2',
        options: {
          useCreateIndex: true,
          useUnifiedTopology: true,
          keepAlive: 3000,
        },
      },
    },
    // mongodb相关路径
    mongodb: {
      binPath: '/usr/local/mongodb/mongodb-linux-x86_64-ubuntu1604-4.0.0/bin/',
      backUpPath: '/home/database/doracms/',,
    },
    // 静态目录
    static: {
      prefix: '/static',
      dir: [
        path.join(appInfo.baseDir, 'app/public'),
        path.join(appInfo.baseDir, 'backstage/dist'),
        '/home/doraData/uploadFiles/static',
      ],
      maxAge: 31536000,
    },
    // 日志路径
    logger: {
      dir: '/home/doraData/logsdir/doracms',
    },
    // 服务地址配置
    server_path: 'https://www.html-js.cn',
    server_api: 'https://www.html-js.cn/api',
  };;
};
