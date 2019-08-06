const path = require('path')

module.exports = {

    mongo_connection_uri: 'mongodb://127.0.0.1:27017/doracms2',
    system_log_path: path.resolve(__dirname, '../../logs'),
    upload_path: process.cwd() + '/public/upload' // 文件上传路径

}