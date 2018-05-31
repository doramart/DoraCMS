const BaseComponent = require('../prototype/baseComponent');
const ContentTemplateModel = require("../models").ContentTemplate;
const TemplateItemsModel = require("../models").TemplateItems;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const cache = require('../../../utils/middleware/cache');
const settings = require('../../../configs/settings');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash');
const axios = require('axios');
const unzip = require('unzip2');
const fs = require('fs');
const iconv = require('iconv-lite');
const http = require('http');
const url = require('url');

function setTempData(res, targetTemp) {
    let tempTree = [];
    tempTree.push({
        id: 'i18n',
        parentId: 0,
        name: res.__("label_tempconfig_tree_i18n"),
        open: false
    });
    tempTree.push({
        id: 'public',
        parentId: 0,
        name: res.__("label_tempconfig_tree_common_temp"),
        open: false
    });
    tempTree.push({
        id: 'users',
        parentId: 0,
        name: res.__("label_tempconfig_tree_users_temp"),
        open: true
    });
    tempTree.push({
        id: 'styles',
        parentId: 0,
        name: res.__("label_tempconfig_tree_styles_temp"),
        open: true
    });
    tempTree.push({
        id: 'js',
        parentId: 0,
        name: res.__("label_tempconfig_tree_script_temp"),
        open: true
    });

    //读取ejs模板
    let newPubPath = siteFunc.setTempParentId(service.scanFolder(settings.SYSTEMTEMPFORDER, targetTemp + "/public"), 'public');
    let newUserPath = siteFunc.setTempParentId(service.scanFolder(settings.SYSTEMTEMPFORDER, targetTemp + "/users"), 'users');
    newPubPath = newPubPath.concat(newUserPath);
    // 读取国际化
    let newI18nPath = siteFunc.setTempParentId(service.scanFolder(process.cwd(), '/locales'), 'i18n');
    newPubPath = newPubPath.concat(newI18nPath);
    //读取静态文件
    if (fs.existsSync(settings.TEMPSTATICFOLDER + targetTemp)) {
        let newStylePath = siteFunc.setTempParentId(service.scanFolder(settings.TEMPSTATICFOLDER, targetTemp + "/css"), 'styles');
        let newJsPath = siteFunc.setTempParentId(service.scanFolder(settings.TEMPSTATICFOLDER, targetTemp + "/js"), 'js');
        newPubPath = newPubPath.concat(newStylePath).concat(newJsPath)
    }
    //读取模板单元
    let filePath = service.scanJustFolder(settings.SYSTEMTEMPFORDER + targetTemp);
    let tempUnit = [];
    tempUnit.push({
        id: 'tempUnit',
        parentId: 0,
        name: res.__("label_tempconfig_tree_script_tempUnit"),
        open: true
    });
    for (let i = 0; i < filePath.length; i++) {
        let fileObj = filePath[i];
        if (fileObj.name.split('-')[1] == 'stage') {
            tempUnit.push({
                id: fileObj.name,
                parentId: 'tempUnit',
                name: fileObj.name,
                open: true
            });
            let unitArr = service.scanFolder(settings.SYSTEMTEMPFORDER, targetTemp + '/' + fileObj.name);
            let newUnitArr = siteFunc.setTempParentId(unitArr, fileObj.name);
            tempUnit = tempUnit.concat(newUnitArr);
        }
    }
    if (tempUnit.length > 0) {
        newPubPath = newPubPath.concat(tempUnit);
    }

    //读取根目录下的所有文件
    let rootArr = service.scanFolder(settings.SYSTEMTEMPFORDER, targetTemp);
    let newRootArr = [];
    for (let j = 0; j < rootArr.length; j++) {
        let rootObj = rootArr[j];

        if (rootObj.type == 'html') {
            let rootFile = siteFunc.setTempParentId(rootObj, 0);
            rootFile.parentId = 0;
            newRootArr.push(rootFile);
        }
    }
    if (newRootArr.length > 0) {
        newPubPath = newPubPath.concat(newRootArr);
    }

    tempTree = tempTree.concat(newPubPath);
    tempTree.sort();
    // console.log('----tempTree---', tempTree);
    return tempTree;
}

function getDefaultTempInfo() {
    return new Promise((resolve, reject) => {
        cache.get(settings.session_secret + '_default_temp', async (defaultTempData) => {
            if (defaultTempData) {
                resolve(defaultTempData)
            } else {
                try {
                    let defaultTemp = await ContentTemplateModel.findOne({ 'using': true }).populate('items').exec();
                    if (!_.isEmpty(defaultTemp)) {
                        // 缓存1天
                        cache.set(settings.session_secret + '_default_temp', defaultTemp, 1000 * 60 * 60 * 24);
                        resolve(defaultTemp)
                    } else {
                        resolve([])
                    }
                } catch (error) {
                    resolve([])
                }
            }
        })
    })
}

function checkFormData(req, res, fields) {
    let errMsg = '';

    if (!validator.isLength(fields.name, 1, 12)) {
        errMsg = res.__("validate_rangelength", { min: 1, max: 12, label: res.__("label_tempconfig_name") });
    }
    if (!validator.isLength(fields.forder, 1, 30)) {
        errMsg = res.__("validate_rangelength", { min: 1, max: 30, label: res.__("label_tempconfig_forder") });
    }
    if (!validator.isLength(fields.comments, 2, 30)) {
        errMsg = res.__("validate_rangelength", { min: 2, max: 30, label: res.__("label_comments") });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

function checkDistForder(targetPath, forderArr) {
    return new Promise((resolve, reject) => {
        let checkState = siteFunc.checkExistFile(service.scanJustFolder(targetPath), forderArr);
        if (checkState) {
            resolve();
        } else {
            let checkTimer = setInterval(() => {
                if (siteFunc.checkExistFile(service.scanJustFolder(targetPath), forderArr)) {
                    clearInterval(checkTimer);
                    resolve();
                }
            }, 2000)
        }
    })
}


class ContentTemplate {
    constructor() {
        // super()
    }

    async getMyTemplateList(req, res, next) {
        try {
            let temps = await ContentTemplateModel.find({}).populate('items').exec();
            let renderData = siteFunc.renderApiData(res, 200, 'ContentTemplate', temps, 'getlist')
            res.send(renderData);
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }

    async getCurrentTempInfo(req, res, next) {
        try {
            let defaultTemp = await getDefaultTempInfo();
            let renderData = siteFunc.renderApiData(res, 200, 'ContentTemplate', defaultTemp, 'getlist');

            return renderData;
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }


    async getContentDefaultTemplate(req, res, next) {
        try {
            let defaultTemp = await ContentTemplateModel.findOne({ 'using': true }).populate('items').exec();
            // console.log('--defaultTemp---', defaultTemp);
            let tempTree = setTempData(res, defaultTemp.alias);
            let renderData = siteFunc.renderApiData(res, 200, 'ContentTemplate', { docs: tempTree }, 'getlist')
            res.send(renderData);
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }

    async getFileInfo(req, res, next) {
        let filePath = req.query.filePath;
        if (filePath && filePath.indexOf('../') >= 0) {
            res.send(siteFunc.renderApiErr(req, res, 500, 'no power', 'getlist'))
        } else {
            let path = siteFunc.getTempBaseFile(filePath) + filePath;
            if (path) {
                try {
                    let fileData = await service.readFile(req, res, path);
                    let renderData = siteFunc.renderApiData(res, 200, 'ContentTemplateFile', { doc: fileData, path: filePath }, 'getlist')
                    res.send(renderData);
                } catch (error) {
                    res.send(siteFunc.renderApiErr(req, res, 500, error, 'getlist'))
                }
            } else {
                res.send(siteFunc.renderApiErr(req, res, 500, 'no power', 'getlist'))
            }
        }
    }

    async updateFileInfo(req, res, next) {
        let fileContent = req.query.code;
        let filePath = req.query.path;
        if (filePath && filePath.indexOf('../') >= 0 || !fileContent) {
            res.send(siteFunc.renderApiErr(req, res, 500, 'no power', 'getlist'))
        } else {
            let path = siteFunc.getTempBaseFile(filePath) + filePath;
            if (path) {
                let writeState = service.writeFile(req, res, path, fileContent);
                if (writeState == 200) {
                    res.send(siteFunc.renderApiData(res, 200, 'ContentTemplateFileUpdate', {}, 'update'));
                } else {
                    res.send(siteFunc.renderApiErr(req, res, 500, 'no path file', 'getlist'))
                }
            } else {
                res.send(siteFunc.renderApiErr(req, res, 500, 'no power', 'getlist'))
            }
        }

    }

    async getTempItemForderList(req, res, next) {
        try {
            let defaultTemp = await getDefaultTempInfo();
            // console.log('--defaultTemp----', defaultTemp);
            let filePath = service.scanJustFolder(settings.SYSTEMTEMPFORDER + defaultTemp.alias);
            let newFilePath = _.filter(filePath, (file) => {
                return file.name.indexOf('stage') >= 0;
            });
            // 对返回结果做初步排序
            newFilePath.sort(function (a, b) { return a.type == "folder" || b.type == "folder" });
            res.send(siteFunc.renderApiData(res, 200, 'ContentTemplateForder', newFilePath, 'getlist'));
        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'getlist'))
        }
    }

    async addTemplateItem(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }

            const tempItemObj = {
                name: fields.name,
                forder: fields.forder,
                isDefault: fields.isDefault,
                comments: fields.comments
            }

            const newContentTemplateItems = new TemplateItemsModel(tempItemObj);
            try {
                await newContentTemplateItems.save();
                let defaultTemp = await getDefaultTempInfo();
                await ContentTemplateModel.findOneAndUpdate({ _id: defaultTemp._id }, { '$push': { items: newContentTemplateItems._id } });
                res.send(siteFunc.renderApiData(res, 200, 'ContentTemplateItems', { id: newContentTemplateItems._id }, 'save'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

    async delTemplateItem(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }

            let defaultTemp = await getDefaultTempInfo();
            await ContentTemplateModel.findOneAndUpdate({ _id: defaultTemp._id }, { '$pull': { items: req.query.ids } });

            await TemplateItemsModel.remove({ _id: req.query.ids });
            res.send(siteFunc.renderApiData(res, 200, 'contentTemplateItems', {}, 'delete'))

        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

    async getTempsFromShop(req, res, next) {
        let current = req.query.current || 1;
        let pageSize = req.query.limit || 10;
        let searchkey = req.query.searchkey;

        let linkParams = `?limit=${pageSize}&currentPage=${current}`;
        try {
            let templateList = await axios.get(settings.DORACMSAPI + '/system/template' + linkParams);
            if (templateList.status == 200) {
                res.send(siteFunc.renderApiData(res, 200, 'contentTemplates', templateList.data, 'getlist'))
            } else {
                res.send(siteFunc.renderApiErr(req, res, 500, error, 'getlist'));
            }
        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'getlist'));
        }
    }

    async installTemp(req, res, next) {
        let tempId = req.query.tempId;
        try {
            if (tempId) {
                let templateInfo = await axios.get(settings.DORACMSAPI + '/system/template/getItem?tempId=' + tempId);
                if (templateInfo.status == 200) {
                    // console.log('----templateInfo---', templateInfo)
                    let tempObj = templateInfo.data;
                    if (_.isEmpty(tempObj)) {
                        throw new siteFunc.UserException(res.__("validate_error_params"));
                    }
                    let file_url = tempObj.filePath;
                    let file_targetForlder = tempObj.alias;
                    let DOWNLOAD_DIR = settings.SYSTEMTEMPFORDER + file_targetForlder.trim() + '/';
                    let target_path = DOWNLOAD_DIR + url.parse(file_url).pathname.split('/').pop();
                    // console.log('------target_path----', target_path);
                    if (fs.existsSync(DOWNLOAD_DIR)) {
                        throw new siteFunc.UserException('您已安装该模板');
                    }

                    fs.mkdir(DOWNLOAD_DIR, function (err) {
                        if (err) {
                            console.log(err);
                            throw new siteFunc.UserException(err);
                        }
                        else {
                            download_file_httpget(file_url, async () => {
                                //下载完成后解压缩
                                let extract = unzip.Extract({ path: DOWNLOAD_DIR });
                                extract.on('error', function (err) {
                                    console.log(err);
                                    //解压异常处理
                                    throw new siteFunc.UserException(err);
                                });
                                extract.on('finish', async () => {
                                    console.log("解压完成!!");
                                    //解压完成处理入库操作
                                    let tempItem = new TemplateItemsModel({
                                        forder: "2-stage-default",
                                        name: 'Default',
                                        isDefault: true
                                    });
                                    let newTempItem = await tempItem.save();

                                    let newTemp = new ContentTemplateModel(tempObj);
                                    newTemp.using = false;
                                    newTemp.items.push(newTempItem._id);
                                    await newTemp.save();

                                    //复制静态文件到公共目录
                                    await checkDistForder(settings.SYSTEMTEMPFORDER + tempObj.alias + '/dist', ['images', 'css', 'js']);
                                    let fromPath = settings.SYSTEMTEMPFORDER + tempObj.alias + '/dist/';
                                    let targetPath = settings.TEMPSTATICFOLDER + tempObj.alias;

                                    service.copyForder(fromPath, targetPath);

                                    res.send(siteFunc.renderApiData(res, 200, 'contentTemplates', {}, 'getlist'))

                                });
                                fs.createReadStream(target_path).pipe(extract);

                            });
                        }

                    });

                    // 文件下载
                    let download_file_httpget = function (file_url, callBack) {
                        let options = {
                            host: url.parse(file_url).host,
                            port: 80,
                            path: url.parse(file_url).pathname
                        };

                        let file_name = url.parse(file_url).pathname.split('/').pop();
                        let file = fs.createWriteStream(DOWNLOAD_DIR + file_name);

                        http.get(options, function (res) {
                            res.on('data', function (data) {
                                file.write(data);
                            }).on('end', function () {
                                file.end();
                                setTimeout(() => {
                                    callBack(DOWNLOAD_DIR);
                                }, 5000)
                            });
                        });
                    };

                } else {
                    res.send(siteFunc.renderApiErr(req, res, 500, error, 'getlist'));
                }
            } else {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'getlist'));
        }


    }

    async enableTemp(req, res, next) {
        var tempId = req.query.tempId;

        try {
            if (!tempId || !shortid.isValid(tempId)) {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }
            // 重置所有模板
            await ContentTemplateModel.update({}, { $set: { 'using': false } }, { multi: true });

            await ContentTemplateModel.findOneAndUpdate({ '_id': tempId }, { $set: { 'using': true } });

            // 更新缓存
            let defaultTemp = await ContentTemplateModel.findOne({ 'using': true }).populate('items').exec();
            cache.set(settings.session_secret + '_default_temp', defaultTemp, 1000 * 60 * 60 * 24);

            res.send(siteFunc.renderApiData(res, 200, 'enableTemplates', {}, 'update'))

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'update'));
        }
    }

    async uninstallTemp(req, res, next) {

        let tempId = req.query.tempId;
        try {

            let errMsg = '';
            if (!siteFunc.checkCurrentId(tempId)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }

            let defaultTemp = await getDefaultTempInfo();
            if (defaultTemp._id == tempId) {
                throw new siteFunc.UserException('can not delete using template');
            } else {
                let targetTemp = await ContentTemplateModel.findOne({ _id: tempId });
                // console.log('---targetTemp---', targetTemp);
                if (!_.isEmpty(targetTemp)) {
                    await TemplateItemsModel.remove({ '_id': { $in: targetTemp.items } });
                    await ContentTemplateModel.remove({ '_id': targetTemp._id });

                    //删除模板文件夹
                    var tempPath = settings.SYSTEMTEMPFORDER + targetTemp.alias;
                    var tempStaticPath = settings.TEMPSTATICFOLDER + targetTemp.alias;
                    await service.deleteFolder(req, res, tempPath);
                    await service.deleteFolder(req, res, tempStaticPath);
                    res.send(siteFunc.renderApiData(res, 200, 'uninstallTemp', {}, 'update'))

                } else {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }

            }

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'update'));
        }
    }
}

module.exports = new ContentTemplate();