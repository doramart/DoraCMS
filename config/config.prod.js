'use strict';
const path = require('path')

module.exports = appInfo => {

    return {
        // 插件路径
        admin_root_path: 'https://cdn.html-js.cn/cms/plugins/static/admin',
        // 数据库连接
        mongoose: {
            client: {
                url: 'mongodb://127.0.0.1:27017/doracms2',
                options: {
                    useCreateIndex: true,
                    useUnifiedTopology: true
                },
            },
        },
        // 静态目录
        static: {
            prefix: '/static',
            dir: [path.join(appInfo.baseDir, 'app/public'), '/home/doraData/uploadFiles/static'],
            maxAge: 31536000,
        },
        // 日志路径
        logger: {
            dir: '/home/doraData/logsdir/doracms',
        },
        // 文件上传路径
        upload_path: '/home/doraData/uploadFiles/static',
        // 服务地址配置
        server_path: 'https://www.html-js.cn',
        server_api: 'https://www.html-js.cn/api',

    }
};