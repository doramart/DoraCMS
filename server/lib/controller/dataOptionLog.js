const BaseComponent = require('../prototype/baseComponent');
const DataOptionLogModel = require("../models").DataOptionLog;
const SystemConfigModel = require("../models").SystemConfig;
const path = require('path')
const formidable = require('formidable');
const {
    service,
    settings,
    validatorUtil,
    logUtil,
    siteFunc
} = require('../../../utils');
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
            res.send({
                state: 'success',
                docs: dataBackList,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            })
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_DATA',
                message: '获取DataItem失败'
            })
        }
    }

    async backUpData(req, res, next) {
        let date = new Date();
        let ms = moment(date).format('YYYYMMDDHHmmss').toString();
        const systemConfigs = await SystemConfigModel.find({});

        if (_.isEmpty(systemConfigs)) {
            res.send({
                state: 'success',
                message: '请先完善系统配置信息'
            });
        }
        let databackforder = isDev ? process.cwd() + '/databak/' : systemConfigs[0].databackForderPath;
        let mongoBinPath = systemConfigs[0].mongodbInstallPath;
        let dataPath = databackforder + ms;
        let cmdstr = isDev ? 'mongodump -d doracms2 -o "' + dataPath + '"' : mongoBinPath + 'mongodump -u ' + settings.USERNAME + ' -p ' + settings.PASSWORD + ' -d ' + settings.DB + ' -o "' + dataPath + '"';

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
                            logs: '数据备份',
                            path: dataPath,
                            fileName: ms + '.zip'
                        }
                        let newDataBack = new DataOptionLogModel(optParams);
                        newDataBack.save((err) => {
                            if (err) {
                                console.log('备份失败：', err);
                                logUtil.error(err, req);
                            }
                            res.send({
                                state: 'success'
                            });
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
                errMsg = '非法请求，请稍后重试！';
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            let currentItem = await DataOptionLogModel.findOne({
                _id: req.query.ids
            });
            if (currentItem && currentItem.path) {
                service.deleteFolder(req, res, currentItem.path);
            } else {
                res.send({
                    state: 'error',
                    message: '操作失败，请稍后重试！'
                });
            }
            await DataOptionLogModel.remove({
                _id: req.query.ids
            });
            res.send({
                state: 'success'
            });
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_IN_SAVE_DATA',
                message: '删除数据失败:' + err,
            })
        }
    }

}

module.exports = new DataItem();