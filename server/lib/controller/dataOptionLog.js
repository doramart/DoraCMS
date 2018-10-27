const BaseComponent = require('../prototype/baseComponent');
const DataOptionLogModel = require("../models").DataOptionLog;
const SystemConfigModel = require("../models").SystemConfig;
const path = require('path')
const formidable = require('formidable');
const {
    service,
    validatorUtil,
    siteFunc
} = require('../../../utils');
const settings = require('../../../configs/settings');
const shortid = require('shortid');
const validator = require('validator')
const archiver = require('archiver')
const fs = require('fs')
const child = require('child_process');
const moment = require('moment')
const _ = require('lodash')
const isDev = process.env.NODE_ENV == 'development' ? true : false;
class DataItem {
    constructor() {
        // super()
    }
    async getDataBakList(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let queryObj = {};

            const dataBackList = await DataOptionLogModel.find(queryObj, '_id date fileName logs').sort({
                date: -1
            }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize));
            const totalItems = await DataOptionLogModel.count();
            let renderData = {
                docs: dataBackList,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            }
            res.send(siteFunc.renderApiData(res, 200, 'dataOptionLog', renderData, 'getlist'));
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async backUpData(req, res) {
        let date = new Date();
        let ms = moment(date).format('YYYYMMDDHHmmss').toString();
        const systemConfigs = await SystemConfigModel.find({});

        if (_.isEmpty(systemConfigs) && !_.isEmpty(req)) {
            res.send(siteFunc.renderApiData(res, 200, res.__("resdata_checkSysConfig_error"), {}, 'getlist'));
        }
        let databackforder = isDev ? process.cwd() + '/databak/' : systemConfigs[0].databackForderPath;
        let mongoBinPath = systemConfigs[0].mongodbInstallPath;
        let dataPath = databackforder + ms;
        let cmdstr = isDev ? 'mongodump -d ' + settings.DB + ' -o "' + dataPath + '"' : mongoBinPath + 'mongodump -u ' + settings.USERNAME + ' -p ' + settings.PASSWORD + ' -d ' + settings.DB + ' -o "' + dataPath + '"';

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

                    output.on('close', function () {
                        console.log(archive.pointer() + ' total bytes');
                        console.log('--数据备份成功--');
                        console.log('archiver has been finalized and the output file descriptor has closed.');
                        // 操作记录入库
                        let optParams = {
                            logs: "Data backup",
                            path: dataPath,
                            fileName: ms + '.zip'
                        }
                        let newDataBack = new DataOptionLogModel(optParams);
                        newDataBack.save((err) => {
                            if (err) {
                                console.log('备份失败：', err);

                            }
                            if (!_.isEmpty(req)) {
                                res.send(siteFunc.renderApiData(res, 200, 'dataOptionLog', {}, 'getlist'));
                            }
                        });
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


    async delDataItem(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            let currentItem = await DataOptionLogModel.findOne({
                _id: req.query.ids
            });
            if (currentItem && currentItem.path) {
                await service.deleteFolder(req, res, currentItem.path);
            } else {
                res.send(siteFunc.renderApiErr(req, res, 500, 'nodata', 'getlist'));

            }
            await DataOptionLogModel.remove({
                _id: req.query.ids
            });
            res.send(siteFunc.renderApiData(res, 200, 'dataOptionLog', {}, 'delete'));

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

}

module.exports = new DataItem();