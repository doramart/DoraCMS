const fs = require('fs');
const path = require('path');
var modulesPath = path.resolve(__dirname, '../');
var shell = require('shelljs');
var settings = require('../publicMethods/settings');
const {
    scanFiles,
    scanforder,
    uploadByQiniu
} = require('./utils');

// 指定打包模块
let designatedModule = [];

let copyType = "dev",
    targetModules = ''; //  ALL 或 separate 可选
let argvs = process.argv;
if (argvs[2] == '--type') {
    copyType = argvs[3];
}
if (argvs[4] == '--modules') {
    targetModules = argvs[5];
    if (targetModules && targetModules != 'ALL') {
        if (targetModules.indexOf(',') >= 0 && targetModules.split(',').length > 0) {
            designatedModule = designatedModule.concat(targetModules.split(','));
        } else {
            designatedModule.push(targetModules);
        }
        console.log('begin build target module: ', targetModules);
    }
}

let targetBuildModules = scanforder(modulesPath);
if (designatedModule.length > 0) {
    targetBuildModules = designatedModule;
}
targetBuildModules.forEach(function (name) {
    if (name != '.git' && name != 'build' && name != 'publicMethods' && name != 'dist') {
        shell.cd(`${modulesPath}/${name}`);
        shell.exec('npm run build');
        if (!fs.existsSync(`${modulesPath}/dist/${name}`)) {
            shell.mkdir('-p', `${modulesPath}/dist/${name}`);
        } else {
            shell.rm('-rf', `${modulesPath}/dist/${name}/*`);
        }
        shell.cp('-R', `${modulesPath}/${name}/dist/*`, `${modulesPath}/dist/${name}`);
        console.info(`module ${name} build success!`);
    }
});

if (copyType == 'prd') {

    let uploadInfo = [];

    let updateQniu = async (uploadInfo) => {
        console.log('Begin upload to Qiniu');
        for (const uploadItem of uploadInfo) {
            let {
                localFile,
                pathKey
            } = uploadItem;
            console.log(`Begin upload ${pathKey}`);
            await uploadByQiniu(localFile, settings.qiniuStaticPath + pathKey);
            console.log(`Upload ${pathKey} success!`);
        }
        console.log('All upload to Qiniu success!');
    }

    if (designatedModule.length > 0) {
        for (const moduleItem of targetBuildModules) {
            uploadInfo = scanFiles(modulesPath, `${modulesPath}/dist/${moduleItem}`);
            updateQniu(uploadInfo);
        }
    } else {
        uploadInfo = scanFiles(modulesPath, `${modulesPath}/dist`);
        updateQniu(uploadInfo);
    }

}