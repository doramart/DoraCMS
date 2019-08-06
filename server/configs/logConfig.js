const settings = require('@configs/settings');

//日志根目录

let baseLogPath = settings.system_log_path;
//错误日志目录
let errorPath = "/error";
//错误日志文件名
let errorFileName = "error";
//错误日志输出完整路径
let errorLogPath = baseLogPath + errorPath + "/" + errorFileName;


//响应日志目录
let responsePath = "/response";
//响应日志文件名
let responseFileName = "response";
//响应日志输出完整路径
let responseLogPath = baseLogPath + responsePath + "/" + responseFileName;

module.exports = {
    appenders: {
        //error logs write by hours
        errorLogger: {
            "type": "dateFile", //log type
            "filename": errorLogPath, // output location
            "pattern": "-yyyy-MM-dd.log", //file extension
            "path": errorPath, //root path,
            "alwaysIncludePattern": true
        },
        resLogger: {
            "type": "dateFile", //log type
            "filename": responseLogPath, // output location
            "path": responsePath, //root path,
            "alwaysIncludePattern": true,
            "pattern": "-yyyy-MM-dd.log" //file extension
        }
    },
    categories: {
        errorLogger: {
            appenders: ["errorLogger"],
            level: "ERROR"
        },
        resLogger: {
            appenders: ["resLogger"],
            level: "ALL"
        },
        default: {
            appenders: ["resLogger"],
            level: "ALL"
        },
    }
};