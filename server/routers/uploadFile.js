/*
 * @Author: doramart 
 * @Date: 2019-08-02 11:13:47 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-02 13:57:15
 */

const express = require('express');
const router = express.Router();
router.caseSensitive = true;
router.strict = true
//文件上传类
const formidable = require('formidable');
const fs = require('fs');

const {
    service,
    mime
} = require('@utils');


//站点配置
const settings = require('@configs/settings');
let checkPathNum = 0;


let confirmPath = (path) => {
    return new Promise(function (resolve, reject) {
        let waitCheck = () => {
            setTimeout(() => {
                if (!fs.existsSync(path)) {
                    if (checkPathNum == 3) {
                        resolve(fs.existsSync(path));
                    } else {
                        checkPathNum++;
                        waitCheck();
                    }
                } else {
                    resolve(fs.existsSync(path));
                }
            }, 200);
        }
        waitCheck();
    })
}

let checkFilePath = async function (path) {
    checkPathNum = 0;
    return await confirmPath(path);
};




router.post('/files', function (req, res, next) {

    let form = new formidable.IncomingForm();
    console.log('start upload');
    //存放目录
    let updatePath = `${settings.upload_path}/images/`;
    let updateVideoPath = `${settings.upload_path}/videos/`;
    let updateApkPath = `${settings.upload_path}/apks/`;
    let newFileName = "",
        fileType = '';
    let uploadType = req.query.type;
    form.encoding = 'utf-8';
    form.keepExtensions = true;
    form.uploadDir = updatePath;

    if (uploadType == 'appPackage') {
        form.maxFileSize = 10 * settings.fsizeLimit;
    } else {
        form.maxFileSize = settings.fsizeLimit;
    }

    form.parse(req, async function (err, fields, files) {

        try {

            //校验文件的合法性
            let realFileType = service.getFileMimeType(files.file.path);
            let contentType = mime[realFileType.fileType] || 'unknown';
            if (contentType == 'unknown') {
                throw new Error(res.__('system_error_imageType'));
            }

            let typeKey = "others";
            let thisType = files.file.name.split('.')[1];
            let ms = (new Date()).getTime().toString();
            // console.log('--realFileType.fileType---', realFileType.fileType)
            if (realFileType.fileType == 'jpg' || realFileType.fileType == 'jpeg' || realFileType.fileType == 'png' || realFileType.fileType == 'gif') {
                fileType = 'images'
            } else if (realFileType.fileType == 'ogg' ||
                realFileType.fileType == 'mp4' ||
                realFileType.fileType == 'avi' ||
                realFileType.fileType == 'flv' ||
                realFileType.fileType == 'wmv') {
                fileType = 'videos'
            } else if (realFileType.fileType == 'zip') {
                if (uploadType == 'appPackage') {
                    fileType = 'apks'
                }
            }

            if (fileType == 'images') {
                typeKey = "img"
            } else if (fileType == 'videos') {
                typeKey = "video"
            } else if (fileType == 'apks') {
                typeKey = "apk"
            }

            newFileName = typeKey + ms + "." + thisType;

            if (fileType == 'images') {
                fs.renameSync(files.file.path, updatePath + newFileName)
            } else if (fileType == 'videos') {
                fs.renameSync(files.file.path, updateVideoPath + newFileName)
            } else if (fileType == 'apks') {
                fs.renameSync(files.file.path, updateApkPath + newFileName)
            }

            let addPath = updatePath + newFileName;
            if (fileType == 'videos') {
                addPath = updateVideoPath + newFileName;
            } else if (fileType == 'apks') {
                addPath = updateApkPath + newFileName;
            }

            if (await checkFilePath(addPath)) {

                renderSuccess(req, res, {
                    data: {
                        path: '/upload/images/' + newFileName
                    }
                });

            } else {
                throw new Error(res.__('system_error_imageType'));
            }
        } catch (err) {
            renderFail(req, res, {
                message: err
            });
        }

    });

});


module.exports = router;