/**
 * Created by Administrator on 2015/5/30.
 */


const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const sendToWormhole = require('stream-wormhole')
const awaitWriteStream = require('await-stream-ready').write
const unzip = require('node-unzip-2');
const url = require('url');


var siteFunc = {

    // 扫描某路径下文件夹是否存在
    checkExistFile(targetPath, forderArr) {

        let distPath = true;
        for (let i = 0; i < forderArr.length; i++) {
            const forder = forderArr[i];
            if (!fs.existsSync(`${targetPath}/${forder}`)) {
                distPath = false;
                break;
            }
        }
        return distPath;
    },

    _checkDistForder(ctx, targetPath, forderArr) {
        return new Promise((resolve, reject) => {
            let checkState = this.checkExistFile(targetPath, forderArr);
            if (checkState) {
                resolve();
            } else {
                let checkTimer = setInterval(() => {
                    if (this.checkExistFile(targetPath, forderArr)) {
                        clearInterval(checkTimer);
                        resolve();
                    }
                }, 2000)
            }
        })
    },

    downloadTempFile(ctx, file_url, DOWNLOAD_DIR) {
        return new Promise(async (resolve, reject) => {
            if (!fs.existsSync(DOWNLOAD_DIR)) {
                fs.mkdirSync(DOWNLOAD_DIR);
            }
            let file_name = url.parse(file_url).pathname.split('/').pop();
            const res = await ctx.curl(file_url, {
                streaming: true,
            });
            let stream = res.res;
            const writeStream = fs.createWriteStream(DOWNLOAD_DIR + file_name)
            try {
                await awaitWriteStream(stream.pipe(writeStream))
                setTimeout(() => {
                    resolve();
                }, 5000)
            } catch (err) {
                // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
                await sendToWormhole(stream)
                reject(err);
            }

        })
    },

    extractfile(ctx, app, DOWNLOAD_DIR, target_path, tempObj, installType) {
        return new Promise((resolve, reject) => {
            //下载完成后解压缩
            let extract = unzip.Extract({
                path: DOWNLOAD_DIR
            });
            extract.on('error', function (err) {
                console.log(err);
                //解压异常处理
                reject(err);
            });
            extract.on('finish', async () => {
                console.log("解压完成!!");
                //解压完成处理入库操作
                if (installType == 'create') {
                    let newTempItem = await ctx.service.templateItem.create({
                        forder: "2-stage-default",
                        name: 'Default',
                        isDefault: true,
                    });

                    let newTempObj = _.assign({}, tempObj, {
                        using: false,
                        items: [],
                        shopTempId: tempObj._id
                    });
                    newTempObj.items.push(newTempItem._id);
                    await ctx.service.contentTemplate.create(newTempObj);
                } else if (installType == 'update') {
                    if (ctx.query.localTempId) {
                        delete tempObj._id;
                        await ctx.service.contentTemplate.update(ctx, ctx.query.localTempId, tempObj);
                    }
                }

                await this._checkDistForder(ctx, app.config.temp_view_forder + tempObj.alias + '/dist', ['images', 'css', 'js']);
                setTimeout(() => {
                    resolve(tempObj.alias);
                }, 5000)

            });
            fs.createReadStream(target_path).pipe(extract);

        })
    },

    async copyThemeToStaticForder(ctx, app, tempAlias, DOWNLOAD_DIR) {
        let temp_static_forder = app.config.temp_static_forder;
        let fromPath = app.config.temp_view_forder + tempAlias + '/dist/*';
        let assetsPath = app.config.temp_view_forder + tempAlias + '/assets/';
        let targetPath = temp_static_forder + tempAlias;
        let targetAssetPath = path.join(app.config.baseDir, `app/assets/${tempAlias}`);
        // 拷贝静态资源
        if (!fs.existsSync(targetPath)) {
            shell.mkdir('-p', targetPath);
        }
        shell.cp('-R', fromPath, targetPath);
        if (!fs.existsSync(targetAssetPath)) {
            shell.mkdir('-p', targetAssetPath);
        }
        shell.cp('-R', assetsPath, targetAssetPath);
        // 拷贝静态资源源文件
        // ctx.helper.copyForder(fromPath, targetPath);
        // ctx.helper.copyForder(assetsPath, targetAssetPath);
        await ctx.helper.deleteFolder(DOWNLOAD_DIR + `${tempAlias}.zip`);
        let macFile = DOWNLOAD_DIR + '__MACOSX';
        if (fs.existsSync(macFile)) {
            await ctx.helper.deleteFolder(macFile);
        }
    },

    async deleteThemeStaticForder(app, tempAlias) {

        let temp_static_forder = app.config.temp_static_forder;
        var tempPath = app.config.temp_view_forder + tempAlias;
        var tempStaticPath = temp_static_forder + tempAlias;
        var tempAssetsPath = path.join(app.config.baseDir, `app/assets/${tempAlias}`);

        shell.rm('-rf', tempPath);
        shell.rm('-rf', tempStaticPath);
        shell.rm('-rf', tempAssetsPath);

    }

    // OPTION_DATABASE_END
};
module.exports = siteFunc;
