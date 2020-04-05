/*
 * @Author: doramart 
 * @Description 服务器关键性配置，务必填写正确
 * @Date: 2020-03-13 09:34:00 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-04-02 23:19:25
 */

/**
 * 服务器配置信息
 * @param  {String} env            [[必填]服务器环境 development:开发环境，production:生产环境]
 * @param  {String} mongodbBinPath [[必填]Mongodb bin目录路径，注意结尾必须带 / ，windows 环境下路径中 \ 必须改为 / 如 C:/mongodb/mongodb/bin/ ] * @param  {String} dbIP           [[必填]Mongodb 数据库IP，默认 127.0.0.1 默认不用更改]
 * @param  {String} dbPort         [[必填]Mongodb 数据库端口号，默认为 27017 默认不用更改]
 * @param  {String} dbName         [Mongodb 数据库名称，默认为 doracms2 默认不用更改]
 * @param  {String} dbUserName     [Mongodb 数据库用户名，没有可以不填，和 dbPassword 同时存在或同时为空]
 * @param  {String} dbPassword     [Mongodb 数据库密码，没有可以不填，和 dbUserName 同时存在或同时为空]
 * @param  {String} os             [[必填]服务器平台 Mac,Windows,Linux 可选]
 * @param  {String} domain         [[必填]网站访问域名或IP+端口号，需要带http/https,如 https://www.html-js.cn, http://120.25.150.169:8080]
 * @param  {String} port           [[必填]DoraCMS 启动默认端口号，domain 中如果也有端口号，那么理论上这两个端口号是相同的]
 * @param  {String} tbAgent        [[必填]NPM安装包是否启用淘宝代理 1：启用 0：不启用，建议启用]
 */

const serverConfig = {
    env: "development",
    mongodbBinPath: "C:/mongodb/mongodb/bin/",
    dbIP: "127.0.0.1",
    dbPort: "27017",
    dbName: "doracms2",
    dbUserName: "",
    dbPassword: "",
    os: "Windows",
    domain: "http://127.0.0.1:8080",
    port: 8080,
    tbAgent: "1",
}

module.exports = serverConfig;