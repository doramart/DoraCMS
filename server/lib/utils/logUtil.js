let log4js = require('log4js');
let fs = require('fs');
let logConfig = require('@configs/logConfig');
let _ = require('lodash');


//加载配置文件
log4js.configure(logConfig);

let errorLogger = log4js.getLogger('errorLogger');
let resLogger = log4js.getLogger('resLogger');

let logUtil = {

    initPath() {
        if (logConfig.baseLogPath) {
            confirmPath(logConfig.baseLogPath)
            //根据不同的logType创建不同的文件目录
            for (let i = 0; i < logConfig.appenders.length; i++) {
                if (logConfig.appenders[i].path) {
                    confirmPath(logConfig.baseLogPath + logConfig.appenders[i].path);
                }
            }
        }
    },

    h5Error(req, error, resTime) {
        if (req) {
            errorLogger.error(formatError(req, error, 'h5', resTime));
        }
    },

    error(error, req, resTime) {
        if (error) {
            if (typeof (error) == "string") {
                errorLogger.error('***** node server error *****', error);
            } else {
                errorLogger.error(formatError(req, error, 'node', resTime));
            }
        }
    },

    res(ctx, resTime) {
        if (ctx) {
            resLogger.info(formatRes(ctx, resTime));
        }
    },

    info(key, info = '') {
        if (key) {
            resLogger.info(key, info);
        }
    }

};

let confirmPath = function (pathStr) {
    if (!fs.existsSync(pathStr)) {
        fs.mkdirSync(pathStr);
    }
}


//格式化响应日志
let formatRes = function (req, resTime) {
    let logText = new String();

    //响应日志开始
    logText += "\n" + "*************** response log start ***************" + "\n";

    //添加请求日志
    logText += formatReqLog(req, resTime);

    //响应状态码
    logText += "response status: " + req.status + "\n";

    //响应内容
    logText += "response body: " + "\n" + JSON.stringify(req.body) + "\n";

    //响应日志结束
    logText += "*************** response log end ***************" + "\n";

    return logText;

}

//格式化错误日志
let formatError = async (req = {}, error = {}, type = 'node', resTime = 0) => {
    let logText = new String();
    let err = type === 'h5' ? req.query : error;
    //错误信息开始
    logText += "\n" + "***************  " + type + " error log start ***************" + "\n";
    //添加请求日志
    if (!_.isEmpty(req)) {
        logText += formatReqLog(req);
    }
    if (type === 'h5') {
        //用户信息
        if (err.userInfo) {
            logText += "request user info:  " + err.userInfo + "\n";
        }
        // 客户端渠道信息
        if (err.pageParams) {
            logText += "request client channel info:  " + err.pageParams + "\n";
        }
        // 客户端设备信息
        if (err.clientInfo) {
            logText += "request mobile info:  " + err.clientInfo + "\n";
        }
        //报错位置
        logText += "err line: " + err.line + ", col: " + err.col + "\n";
        //错误信息
        logText += "err message: " + err.msg + "\n";
        //错误页面
        logText += "err url: " + err.url + "\n";

    } else { // node server
        //错误名称
        logText += "err name: " + error.name + "\n";
        //错误信息
        logText += "err message: " + error.message + "\n";
        //错误详情
        logText += "err stack: " + error.stack + "\n";
    }
    //错误信息结束
    logText += "***************  " + type + "  error log end ***************" + "\n";

    // LOGS_INSERT_BEGIN
    const {
        systemOptionLogService
    } = require("@service");
    await systemOptionLogService.create({
        type: type + '-exception',
        logs: logText
    });
    // LOGS_INSERT_END

    return logText;
};

//格式化请求日志
let formatReqLog = function (req) {

    let logText = new String();
    let method = req.method;
    // 访问路径
    logText += "request url: " + req.url + "\n";
    //访问方法
    logText += "request method: " + method + "\n";
    //客户端ip
    logText += "request client ip:  " + req.ip + "\n";

    return logText;
}




module.exports = logUtil;