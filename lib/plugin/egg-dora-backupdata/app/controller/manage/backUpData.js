const moment = require('moment');
const isDev = process.env.NODE_ENV == 'development' ? true : false;
const fs = require("fs");
const _ = require('lodash');
const child = require('child_process');
const archiver = require('archiver')
const muri = require('muri');
let BackUpDataController = {

    async list(ctx, app) {

        try {

            let payload = ctx.query;
            let backUpDataList = await ctx.service.backUpData.find(payload);

            ctx.helper.renderSuccess(ctx, {
                data: backUpDataList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },


    async backUpData(ctx, app) {

        let ms = moment(new Date()).format('YYYYMMDDHHmmss').toString();

        let databackforder = app.config.mongodb.backUpPath;
        let dataPath = databackforder + ms;

        const parsedUri = muri(app.config.mongoose.client.url)
        const parameters = []
        if (parsedUri.auth) {
            parameters.push(`-u "${parsedUri.auth.user}"`, `-p "${parsedUri.auth.pass}"`)
        }
        if (parsedUri.db) {
            parameters.push(`-d "${parsedUri.db}"`)
        }
        let cmdstr = `${app.config.mongodb.binPath}mongodump ${parameters.join(' ')} -o "${dataPath}"`

        if (!fs.existsSync(databackforder)) {
            fs.mkdirSync(databackforder);
        }
        if (fs.existsSync(dataPath)) {
            console.log('已经创建过备份了');
        } else {
            fs.mkdirSync(dataPath);

            try {
                child.execSync(cmdstr);
                let doArchive = () => {
                    return new Promise((resolve, reject) => {
                        let output = fs.createWriteStream(databackforder + ms + '.zip');
                        let archive = archiver('zip');

                        output.on('close', async () => {
                            console.log('back up data success');
                            // 操作记录入库
                            let optParams = {
                                logs: "Data backup",
                                path: dataPath,
                                fileName: ms + '.zip'
                            }

                            await ctx.service.backUpData.create(optParams);
                            resolve();

                        });

                        output.on('end', function (ctx, app) {
                            console.log('Data has been drained');
                        });

                        archive.on('error', function (err) {
                            throw err;
                        });

                        archive.pipe(output);
                        archive.directory(dataPath + '/', false);
                        archive.finalize();
                    })
                }
                await doArchive();
                ctx.helper.renderSuccess(ctx);
            } catch (error) {
                ctx.helper.renderFail(ctx, {
                    message: err
                });
            }

        }

    },

    // 数据恢复
    async restoreData(ctx, app) {

        try {
            let files = ctx.request.body || {};
            if (!files.id) {
                throw new Error(ctx.__('validate_error_params'));
            }
            let targetDataInfo = await ctx.service.backUpData.item(ctx, {
                query: {
                    _id: files.id
                }
            });
            if (_.isEmpty(targetDataInfo)) {
                throw new Error(ctx.__('validate_error_params'));
            }
            let localDataPath = targetDataInfo.path;

            const parsedUri = muri(app.config.mongoose.client.url)
            const parameters = []
            if (parsedUri.auth) {
                parameters.push(`-u "${parsedUri.auth.user}"`, `-p "${parsedUri.auth.pass}"`)
            }
            if (parsedUri.db) {
                parameters.push(`-d "${parsedUri.db}"`)
            }

            if (!fs.existsSync(`${localDataPath}/${parsedUri.db}`)) {
                throw new Error(ctx.__('validate_error_params'));
            }

            let cmdstr = `${app.config.mongodb.binPath}mongorestore ${parameters.join(' ')} --drop ${localDataPath}/${parsedUri.db}`

            child.execSync(cmdstr);

            // 操作记录入库
            let optParams = {
                logs: "Data restore",
                path: `${localDataPath}/${parsedUri.db}`
            }

            await ctx.service.backUpData.create(optParams);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }

    },




    async removes(ctx, app) {

        try {
            let targetIds = ctx.query.ids;

            let currentItem = await ctx.service.backUpData.item(ctx, {
                query: {
                    _id: targetIds
                }
            });
            if (currentItem && currentItem.path) {
                await ctx.helper.deleteFolder(currentItem.path);
            } else {
                throw new Error(ctx.__('validate_error_params'));
            }

            await ctx.service.backUpData.removes(ctx, targetIds);
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }

}



module.exports = BackUpDataController;