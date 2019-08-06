/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-06 08:57:30
 */


const {
    dataOptionLogService,
    systemConfigService
} = require('@service');
const moment = require('moment');
const isDev = process.env.NODE_ENV == 'development' ? true : false;
const fs = require("fs");
const _ = require('lodash');
const child = require('child_process');
const archiver = require('archiver')
const settings = require('@configs/settings')
const {
    service,
} = require('@utils');
const muri = require('muri');
exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let dataOptionLogList = await dataOptionLogService.find(payload);

        renderSuccess(req, res, {
            data: dataOptionLogList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.backUpData = async (req, res) => {
    let date = new Date();
    let ms = moment(date).format('YYYYMMDDHHmmss').toString();
    const systemConfigs = await systemConfigService.find({
        isPaging: '0'
    });
    // console.log('--systemConfigs--', systemConfigs);
    if (_.isEmpty(systemConfigs) && !_.isEmpty(req)) {
        throw new Error(res.__("resdata_checkSysConfig_error"));
    }
    let idDev = process.env.NODE_ENV == 'development' ? true : false;
    let databackforder = idDev ? process.cwd() + '/databak/' : systemConfigs[0].databackForderPath;
    let mongoBinPath = systemConfigs[0].mongodbInstallPath;
    let dataPath = databackforder + ms;

    const parsedUri = muri(settings.mongo_connection_uri)
    const parameters = []
    if (parsedUri.auth) {
        parameters.push(`-u "${parsedUri.auth.user}"`, `-p "${parsedUri.auth.pass}"`)
    }
    if (parsedUri.db) {
        parameters.push(`-d "${parsedUri.db}"`)
    }
    let cmdstr = (isDev ? '' : mongoBinPath) + `mongodump ${parameters.join(' ')} -o "${dataPath}"`

    if (!fs.existsSync(databackforder)) {
        fs.mkdirSync(databackforder);
    }
    if (fs.existsSync(dataPath)) {
        console.log('已经创建过备份了');
    } else {
        fs.mkdirSync(dataPath);
        child.exec(cmdstr, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                //生成压缩文件
                let output = fs.createWriteStream(databackforder + ms + '.zip');
                let archive = archiver('zip');

                output.on('close', async () => {
                    console.log(archive.pointer() + ' total bytes');
                    console.log('back up data success');
                    console.log('archiver has been finalized and the output file descriptor has closed.');
                    // 操作记录入库
                    let optParams = {
                        logs: "Data backup",
                        path: dataPath,
                        fileName: ms + '.zip'
                    }

                    await dataOptionLogService.create(optParams);
                    !_.isEmpty(res) && renderSuccess(req, res);
                });

                output.on('end', function () {
                    console.log('Data has been drained');
                });

                archive.on('error', function (err) {
                    throw err;
                });

                archive.pipe(output);
                archive.directory(dataPath + '/', false);
                archive.finalize();
            }
        });
    }


}



exports.removes = async (req, res, next) => {
    try {
        let targetIds = req.query.ids;

        let currentItem = await dataOptionLogService.item(res, {
            query: {
                _id: targetIds
            }
        });
        if (currentItem && currentItem.path) {
            await service.deleteFolder(currentItem.path);
        } else {
            throw new Error(res.__('validate_error_params'));
        }

        await dataOptionLogService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}