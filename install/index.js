/*
 * @Author: doramart 
 * @Description install step_1
 * @Date: 2020-03-13 08:43:33 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-03-16 12:34:49
 */


var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
const path = require("path");
const fs = require('fs');
const needInstallPlugin = ["mammoth", "node-schedule"];
const needModules = ["egg-scripts", "gulp", "apidoc"];
const installPath = path.join(process.cwd(), './install');
const localPath = path.join(process.cwd(), '');
let jsonPath = installPath + '/serverConfig.js';
let serverConfig = require(jsonPath);
let agentStr = serverConfig.tbAgent == '1' ? '--registry=https://registry.npm.taobao.org' : '';

const modifyFileByReplace = (targetPath, replaceStr, targetStr) => {
    var readText = fs.readFileSync(targetPath, 'utf-8');
    var reg = new RegExp(replaceStr, "g")
    if (replaceStr.indexOf('path.join') >= 0 || replaceStr.indexOf('"egg":') >= 0) {
        reg = replaceStr;
    }
    var newRenderContent = readText.replace(reg, targetStr);
    fs.writeFileSync(targetPath, newRenderContent);
}


const deleteFolder = (path) => {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolder(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

const checkMongo = async (params) => {
    let {
        env,
        dbIP,
        dbPort,
        dbName,
        dbUserName,
        dbPassword,
        os,
        domain,
        port
    } = params;

    if (!domain) {
        throw new Error("请填写正确的服务器外网域名或IP+端口号！");
    }
    if (!port) {
        throw new Error("请填写正确的 DoraCMS 启动默认端口号！");
    }
    if (env != process.env.NODE_ENV) {
        throw new Error("您当前环境和传入的配置不匹配！");
    }
    if (!dbIP || !dbPort) {
        throw new Error("请填写正确的数据库IP或端口号！");
    }
    if (!os || os == 'other') {
        throw new Error("您的操作系统不支持该安装流程！");
    }
    if (!dbName) {
        throw new Error("数据库名称不正确！");
    }
    if (dbUserName && !dbPassword || !dbUserName && dbPassword) {
        throw new Error("数据库用户名或密码不正确");
    }
    let checkResult = await checkMongoCon(params);
    // 如果校验成功，直接进行数据库初始化操作
    if (checkResult.state) {
        installSystemModules();
        console.log('begin init mongodb');
        let mongoStr;
        if (os.indexOf('Mac') >= 0) {
            mongoStr = 'mongorestore';
        } else if (os.indexOf('Windows') >= 0) {
            mongoStr = "mongorestore";
        } else if (os.indexOf('Linux') >= 0) {
            mongoStr = 'mongorestore';
        } else {
            throw new Error("您的操作系统不支持该安装流程！");
        }
        initDataBase(checkResult.linkStr, mongoStr);
        return checkResult.linkStr;
    } else {
        throw new Error("数据库无法连接成功，请确认是否开启mongodb！");
    }

}
const checkMongoCon = (params) => {
    return new Promise((resolve, reject) => {
        const MongoClient = require('mongodb').MongoClient;
        let linkStr;
        if (params.dbUserName && params.dbPassword) {
            linkStr = `mongodb://${params.dbUserName}:${params.dbPassword}@${params.dbIP}:${params.dbPort}/${params.dbName}`;
        } else {
            linkStr = `mongodb://${params.dbIP}:${params.dbPort}/${params.dbName}`;
        }
        MongoClient.connect(linkStr, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, async function (err, client) {
            if (err) {
                resolve({
                    state: false
                })
            } else {
                client.close();
                console.log("*****************数据库连接成功*****************");
                resolve({
                    state: true,
                    linkStr
                });
            }

        });

    })
}

const installSystemModules = () => {
    const shell = require('shelljs');
    console.log('*****************开始安装全局依赖*****************');
    for (const md of needModules) {
        shell.exec(`npm install ${md} ${agentStr} -g`);
    }

    console.log('*****************开始安装系统依赖*****************');
    shell.exec(`cd ${localPath}`);
    shell.exec(`npm install ${agentStr}`);


    console.log('*****************开始安装插件依赖*****************');
    for (const pluginItem of needInstallPlugin) {
        shell.exec(`npm install ${pluginItem} ${agentStr}`);
    }
}

const initDataBase = (mongoUri, binPath) => {
    const shell = require('shelljs');
    const muri = require('muri')
    const parsedUri = muri(mongoUri)
    const parameters = []

    if (parsedUri.hosts && parsedUri.hosts.length) {
        const host = parsedUri.hosts[0]
        parameters.push(`-h ${host.host}`, `--port ${host.port}`)
    }

    if (parsedUri.auth) {
        parameters.push(`-u "${parsedUri.auth.user}"`, `-p "${parsedUri.auth.pass}"`)
    }

    if (parsedUri.db) {
        parameters.push(`-d ${parsedUri.db}`)
    }

    let bakForder = path.join(process.cwd(), './databak');

    parameters.push(`--drop ${bakForder}/${parsedUri.db}`)

    const cmd = `${binPath} ${parameters.join(' ')}`

    shell.exec(cmd).stdout;
}

exec('node -v', (error, stdout, stderr) => {
    if (error) {
        throw new Error("获取 nodejs 版本号失败！");
    }
    console.log('Nodejs 版本号:', stdout);
})

if (!process.env.NODE_ENV) {
    throw new Error("请先设置系统环境变量！");
}

console.log('系统环境变量:', process.env.NODE_ENV);

if (fs.existsSync(localPath + '/node_modules')) {
    deleteFolder(localPath + '/node_modules');
}

if (fs.existsSync(localPath + '/package-lock.json')) {
    fs.unlinkSync(localPath + '/package-lock.json')
}

// 全局安装shelljs
execSync(`npm install shelljs ${agentStr}`);
execSync(`npm install mongodb ${agentStr}`);


const askStep_1 = async () => {

    try {
        const shell = require('shelljs');
        let mongolinkStr = await checkMongo(serverConfig);

        // 修改配置文件
        modifyFileByReplace(`${localPath}/config/config.default.js`, "8080", serverConfig.port);

        if (serverConfig.env == 'development') {
            modifyFileByReplace(`${localPath}/config/config.local.js`, "mongodb://127.0.0.1:27017/doracms2", mongolinkStr);
            modifyFileByReplace(`${localPath}/config/config.local.js`, "http://127.0.0.1:8080", serverConfig.domain);
            setTimeout(() => {
                shell.exec('npm run dev');
            }, 3000)

        } else if (serverConfig.env == 'production') {
            modifyFileByReplace(`${localPath}/config/config.prod.js`, "mongodb://127.0.0.1:27017/doracms2", mongolinkStr);
            modifyFileByReplace(`${localPath}/config/config.prod.js`, "https://www.html-js.cn", serverConfig.domain);
            setTimeout(() => {
                shell.exec('npm run start');
            }, 3000)
        }

        console.log('系统初始化成功，访问地址:' + serverConfig.domain);

    } catch (error) {
        console.log(error.message);
    }
}

// 数据导入
askStep_1();