let path = require('path');

//日志根目录

let isDevEnv = (process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'FAT') ? true : false;
let baseLogPath = isDevEnv ? path.resolve(__dirname, '../logs') : '/home/doraData/logsdir/doracms';
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
    "appenders":
    [
        //错误日志 默认按小时数记录
        {
            "category": "errorLogger",             //logger名称
            "type": "dateFile",                   //日志类型
            "filename": errorLogPath,             //日志输出位置
            "alwaysIncludePattern": true,          //是否总是有后缀名
            "pattern": "-yyyy-MM-dd.log",      //后缀，每天创建一个新的日志文件
            "path": errorPath                     //自定义属性，错误日志的根目录
        },
        //响应日志 响应日志默认按天记录
        {
            "category": "resLogger",
            "type": "dateFile",
            "filename": responseLogPath,
            "alwaysIncludePattern": true,
            "pattern": "-yyyy-MM-dd.log",   //后缀，每天创建一个新的日志文件
            "path": responsePath
        }
    ],
    "levels":                                   //设置logger名称对应的的日志等级
    {
        "errorLogger": "ERROR",
        "resLogger": "ALL"
    },
    "baseLogPath": baseLogPath                  //logs根目录
}