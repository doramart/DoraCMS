/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-02 13:54:59
 */


const {
    contentTemplateService,
    templateItemService
} = require('@service');
const formidable = require('formidable');
const {
    validateForm
} = require('../validate/index');

const _ = require('lodash');
const settings = require('@configs/settings');
const {
    cache,
    siteFunc,
    service
} = require('@utils');

const shortid = require('shortid');
const validator = require('validator')
const axios = require('axios');
const unzip = require('unzip2');
const fs = require('fs');
const iconv = require('iconv-lite');
const http = require('http');
const url = require('url');
const system_template_forder = process.cwd() + '/views/';

exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let contentTemplateList = await contentTemplateService.find(payload, {
            populate: ['items']
        });

        renderSuccess(req, res, {
            data: contentTemplateList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.getOne = async (req, res, next) => {
    try {
        let _id = req.query.id;

        let targetUser = await contentTemplateService.item(res, {
            query: {
                _id: _id
            }
        });

        renderSuccess(req, res, {
            data: targetUser
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }

}


exports.removes = async (req, res, next) => {
    try {
        let targetIds = req.query.ids;
        await contentTemplateService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}


exports._setTempData = (res, targetTemp) => {
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
    let newPubPath = siteFunc.setTempParentId(service.scanFolder(system_template_forder, targetTemp + "/public"), 'public');
    let newUserPath = siteFunc.setTempParentId(service.scanFolder(system_template_forder, targetTemp + "/users"), 'users');
    newPubPath = newPubPath.concat(newUserPath);
    // 读取国际化
    let newI18nPath = siteFunc.setTempParentId(service.scanFolder(process.cwd(), '/server/locales'), 'i18n');
    newPubPath = newPubPath.concat(newI18nPath);
    let temp_static_forder = process.cwd() + '/public/themes/';
    //读取静态文件
    if (fs.existsSync(temp_static_forder + targetTemp)) {
        let newStylePath = siteFunc.setTempParentId(service.scanFolder(temp_static_forder, targetTemp + "/css"), 'styles');
        let newJsPath = siteFunc.setTempParentId(service.scanFolder(temp_static_forder, targetTemp + "/js"), 'js');
        newPubPath = newPubPath.concat(newStylePath).concat(newJsPath)
    }
    //读取模板单元
    let filePath = service.scanJustFolder(system_template_forder + targetTemp);
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
            let unitArr = service.scanFolder(system_template_forder, targetTemp + '/' + fileObj.name);
            let newUnitArr = siteFunc.setTempParentId(unitArr, fileObj.name);
            tempUnit = tempUnit.concat(newUnitArr);
        }
    }
    if (tempUnit.length > 0) {
        newPubPath = newPubPath.concat(tempUnit);
    }

    //读取根目录下的所有文件
    let rootArr = service.scanFolder(system_template_forder, targetTemp);
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

exports._getDefaultTempInfo = () => {
    return new Promise((resolve, reject) => {
        cache.get(settings.session_secret + '_default_temp', async (defaultTempData) => {
            if (defaultTempData) {
                resolve(defaultTempData)
            } else {
                try {
                    let defaultTemp = await contentTemplateService.item(res, {
                        query: {
                            'using': true
                        },
                        populate: ['items']
                    })
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

exports._checkDistForder = (targetPath, forderArr) => {
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


exports.getMyTemplateList = async (req, res, next) => {
    try {
        let temps = await contentTemplateService.find({
            isPaging: '0'
        }, {
            populate: ['items']
        })
        renderSuccess(req, res, {
            data: temps
        });
    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}

exports.getContentDefaultTemplate = async (req, res, next) => {
    try {

        let defaultTemp = await contentTemplateService.item(res, {
            query: {
                'using': true
            },
            populate: ['items']
        })

        let tempTree = this._setTempData(res, defaultTemp.alias);
        renderSuccess(req, res, {
            data: {
                docs: tempTree
            }
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}

exports.getFileInfo = async (req, res, next) => {
    try {
        let filePath = req.query.filePath;
        if (filePath && (filePath.split('./').length > 1)) {
            throw new Error('no power');
        } else {
            let path = siteFunc.getTempBaseFile(filePath) + filePath;
            if (path) {
                let fileData = await service.readFile(req, res, path);
                renderSuccess(req, res, {
                    data: {
                        doc: fileData,
                        path: filePath
                    }
                });
            } else {
                throw new Error('no power');
            }
        }
    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}

exports.updateFileInfo = async (req, res, next) => {


    let fields = req.body || {};
    let fileContent = fields.code;
    let filePath = fields.path;
    try {
        if (!fileContent || !filePath) {
            throw new Error(res.__('validate_error_params'));
        }
        if (filePath && (filePath.split('./').length > 1)) {
            throw new Error(res.__('validate_error_params'));
        } else {
            let path = siteFunc.getTempBaseFile(filePath) + filePath;
            if (path) {
                let writeState = service.writeFile(req, res, path, fileContent);
                if (writeState == 200) {
                    renderSuccess(req, res);
                } else {
                    throw new Error('no path file');
                }
            } else {
                throw new Error('no power');
            }
        }

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }

}

exports.getTempItemForderList = async (req, res, next) => {
    try {
        let defaultTemp = await this._getDefaultTempInfo();
        let filePath = service.scanJustFolder(system_template_forder + defaultTemp.alias);
        let newFilePath = _.filter(filePath, (file) => {
            return file.name.indexOf('stage') >= 0;
        });
        // 对返回结果做初步排序
        newFilePath.sort(function (a, b) {
            return a.type == "folder" || b.type == "folder"
        });
        renderSuccess(req, res, {
            data: newFilePath
        });
    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}

exports.addTemplateItem = async (req, res, next) => {

    try {
        let fields = req.body || {};
        const formObj = {
            name: fields.name,
            forder: fields.forder,
            isDefault: fields.isDefault,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'contentTemplate', formObj);

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let newContentTemplateItems = await templateItemService.create(formObj);

        let defaultTemp = await this._getDefaultTempInfo();
        await contentTemplateService.addItems(defaultTemp._id, newContentTemplateItems._id);

        renderSuccess(req, res, {
            data: {
                id: newContentTemplateItems._id
            }
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}

exports.delTemplateItem = async (req, res, next) => {
    try {
        let errMsg = '';
        if (!checkCurrentId(req.query.ids)) {
            errMsg = res.__("validate_error_params");
        }
        if (errMsg) {
            throw new Error(errMsg);
        }

        let defaultTemp = await this._getDefaultTempInfo();
        await contentTemplateService.removeItems(defaultTemp._id, req.query.ids);

        await templateItemService.removes(res, req.query.ids);

        renderSuccess(req, res);

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}

exports.getTempsFromShop = async (req, res, next) => {
    let current = req.query.current || 1;
    let pageSize = req.query.limit || 10;

    let linkParams = `?limit=${pageSize}&currentPage=${current}`;
    try {
        let templateList = await axios.get(settings.doracms_api + '/system/template' + linkParams);
        if (templateList.status == 200) {
            renderSuccess(req, res, {
                data: templateList.data
            });
        } else {
            renderFail(req, res, {
                message: 'get template error'
            });
        }
    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}

exports.installTemp = async (req, res, next) => {
    let tempId = req.query.tempId;
    try {
        if (tempId) {
            let templateInfo = await axios.get(settings.doracms_api + '/system/template/getItem?tempId=' + tempId);
            if (templateInfo.status == 200) {
                // console.log('----templateInfo---', templateInfo)
                let tempObj = templateInfo.data;
                if (_.isEmpty(tempObj)) {
                    throw new Error(res.__("validate_error_params"));
                }
                let file_url = tempObj.filePath;
                let file_targetForlder = tempObj.alias;
                let DOWNLOAD_DIR = system_template_forder + file_targetForlder.trim() + '/';
                let target_path = DOWNLOAD_DIR + url.parse(file_url).pathname.split('/').pop();
                // console.log('------target_path----', target_path);
                if (fs.existsSync(DOWNLOAD_DIR)) {
                    throw new Error('您已安装该模板');
                }

                fs.mkdir(DOWNLOAD_DIR, (err) => {
                    if (err) {
                        console.log(err);
                        throw new Error(err);
                    } else {
                        download_file_httpget(file_url, async () => {
                            //下载完成后解压缩
                            let extract = unzip.Extract({
                                path: DOWNLOAD_DIR
                            });
                            extract.on('error', function (err) {
                                console.log(err);
                                //解压异常处理
                                throw new Error(err);
                            });
                            extract.on('finish', async () => {
                                console.log("解压完成!!");
                                //解压完成处理入库操作
                                let newTempItem = await templateItemService.create({
                                    forder: "2-stage-default",
                                    name: 'Default',
                                    isDefault: true,
                                });

                                let newTempObj = _.assign({}, tempObj, {
                                    using: false,
                                    items: []
                                });
                                newTempObj.items.push(newTempItem._id);
                                await contentTemplateService.create(newTempObj);

                                //复制静态文件到公共目录
                                let temp_static_forder = process.cwd() + '/public/themes/';
                                await this._checkDistForder(system_template_forder + tempObj.alias + '/dist', ['images', 'css', 'js']);
                                let fromPath = system_template_forder + tempObj.alias + '/dist/';
                                let targetPath = temp_static_forder + tempObj.alias;

                                service.copyForder(fromPath, targetPath);

                                renderSuccess(req, res);

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
                throw new Error('install error');
            }
        } else {
            throw new Error(res.__("validate_error_params"));
        }

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }


}

exports.uploadCMSTemplate = async (req, res, next) => {

    let form = new formidable.IncomingForm(),
        files = [],
        fields = [],
        docs = [];
    //存放目录
    let forderName;
    form.uploadDir = system_template_forder;
    form.maxFileSize = 5 * 1024 * 1024; // 最大5MB
    form.parse(req, async (err, fields, files) => {
        if (err) {
            renderFail(req, res, {
                message: err
            });
        } else {
            try {
                fs.renameSync(files.file.path, system_template_forder + files.file.name);
                forderName = files.file.name.split('.')[0];
                console.log('parsing done');
                var target_path = system_template_forder + forderName + '.zip';
                var DOWNLOAD_DIR = system_template_forder + forderName + '/';

                if (fs.existsSync(DOWNLOAD_DIR)) {
                    await service.deleteFolder(target_path);
                    throw new Error('您已安装该模板');
                }

                var realType = service.getFileMimeType(target_path);
                if (realType.fileType != 'zip') {
                    fs.unlinkSync(target_path);
                    throw new Error('文件类型不正确');
                }

                fs.mkdirSync(DOWNLOAD_DIR);
                //下载完成后解压缩
                var extract = unzip.Extract({
                    path: DOWNLOAD_DIR
                });
                extract.on('error', function (err) {
                    console.log(err);
                    //解压异常处理
                    throw new Error(err);
                });
                extract.on('finish', async function () {
                    console.log("解压完成!!");
                    //解压完成检查文件是否完整
                    let checkResult = await service.checkTempUnzipSuccess(forderName);
                    if (checkResult == '1') {
                        let targetForder = forderName;
                        var tempForder = system_template_forder + targetForder;

                        if (targetForder) {
                            var jsonPath = tempForder + '/tempconfig.json';
                            fs.readFile(jsonPath, "binary", async (error, data) => {
                                if (error) {
                                    throw new Error('文件读取失败');
                                } else {
                                    //处理中文乱码问题
                                    var buf = new Buffer(data, 'binary');
                                    var newData = iconv.decode(buf, 'utf-8');

                                    var tempInfoData = eval("(" + newData + ")")[0];
                                    if (tempInfoData && tempInfoData.name && tempInfoData.alias && tempInfoData.version && tempInfoData.sImg && tempInfoData.author && tempInfoData.comment) {

                                        service.checkTempInfo(tempInfoData, targetForder, async (data) => {
                                            try {
                                                if (data != 'success') {
                                                    await service.deleteFolder(tempForder);
                                                    await service.deleteFolder(tempForder + '.zip');
                                                    throw new Error(data);

                                                } else {
                                                    let oldTemp = await ContentTemplateModel.findOne({
                                                        $or: [{
                                                            'name': tempInfoData.name
                                                        }, {
                                                            'alias': tempInfoData.alias
                                                        }]
                                                    });
                                                    if (!_.isEmpty(oldTemp)) {
                                                        throw new Error("模板名称或key已存在，请修改后重试！");
                                                    }
                                                    //复制静态文件到公共目录
                                                    let temp_static_forder = process.cwd() + '/public/themes/';
                                                    var fromPath = system_template_forder + targetForder + '/dist/';
                                                    var targetPath = temp_static_forder + targetForder;
                                                    service.copyForder(fromPath, targetPath);

                                                    var tempItem = {};
                                                    tempItem.forder = "2-stage-default";
                                                    tempItem.name = '默认模板';
                                                    tempItem.isDefault = true;
                                                    await templateItemService.create(tempItem);

                                                    var tempObj = {
                                                        name: tempInfoData.name,
                                                        alias: tempInfoData.alias,
                                                        version: tempInfoData.version,
                                                        sImg: '/themes/' + targetForder + tempInfoData.sImg,
                                                        author: tempInfoData.author,
                                                        comment: tempInfoData.comment,
                                                        items: []
                                                    };

                                                    tempObj.using = false;
                                                    tempObj.items.push(tempItem);
                                                    await contentTemplateService.create(tempObj);

                                                    await service.deleteFolder(tempForder + '.zip');

                                                    renderSuccess(req, res);

                                                }
                                            } catch (err) {
                                                await service.deleteFolder(tempForder);
                                                await service.deleteFolder(tempForder + '.zip');
                                                renderFail(req, res, {
                                                    message: err
                                                });

                                            }
                                        });

                                    } else {
                                        await service.deleteFolder(tempForder);
                                        await service.deleteFolder(tempForder + '.zip');
                                        renderFail(req, res, {
                                            message: '请正确填写配置文件'
                                        });
                                    }

                                }
                            });

                        } else {
                            res.end('文件不完整，请稍后重试！');
                        }

                    } else {
                        throw new Error(res.__('validate_error_params'));
                    }

                });
                fs.createReadStream(target_path).pipe(extract);


            } catch (err) {
                renderFail(req, res, {
                    message: err
                });
            }
        }

    });


}

exports.enableTemp = async (req, res, next) => {
    var tempId = req.query.tempId;

    try {
        if (!tempId || !shortid.isValid(tempId)) {
            throw new Error(res.__("validate_error_params"));
        }
        // 重置所有模板
        await contentTemplateService.updateMany(res, '', {
            'using': false
        })
        await contentTemplateService.update(res, tempId, {
            'using': true
        })

        // 更新缓存
        let defaultTemp = await contentTemplateService.item(res, {
            query: {
                'using': true
            },
            populate: ['items']
        })
        cache.set(settings.session_secret + '_default_temp', defaultTemp, 1000 * 60 * 60 * 24);

        renderSuccess(req, res);

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}

exports.uninstallTemp = async (req, res, next) => {

    let tempId = req.query.tempId;
    try {

        let errMsg = '';
        if (!checkCurrentId(tempId)) {
            errMsg = res.__("validate_error_params");
        }
        if (errMsg) {
            throw new Error(errMsg);
        }

        let defaultTemp = await this._getDefaultTempInfo();
        if (defaultTemp._id == tempId) {
            throw new Error('can not delete using template');
        } else {
            let targetTemp = await contentTemplateService.item(res, {
                query: {
                    _id: tempId
                }
            })
            // console.log('---targetTemp---', targetTemp);
            if (!_.isEmpty(targetTemp)) {
                await templateItemService.removes(res, (targetTemp.items).join(','));
                await contentTemplateService.removes(res, targetTemp._id)

                //删除模板文件夹
                let temp_static_forder = process.cwd() + '/public/themes/';
                var tempPath = system_template_forder + targetTemp.alias;
                var tempStaticPath = temp_static_forder + targetTemp.alias;
                await service.deleteFolder(tempPath);
                await service.deleteFolder(tempStaticPath);
                renderSuccess(req, res);

            } else {
                throw new Error(res.__("validate_error_params"));
            }

        }

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}