const moment = require('moment');
const isDev = process.env.NODE_ENV == 'development' ? true : false;
const fs = require("fs");
const _ = require('lodash');
const child = require('child_process');
const archiver = require('archiver')
const muri = require('muri');

module.exports = app => {

    return {
        schedule: {
            cron: app.config.backUpTick,
            type: 'all', // 指定所有的 worker 都需要执行
        },
        async task(ctx) {

            let date = new Date();
            let ms = moment(date).format('YYYYMMDDHHmmss').toString();
            const systemConfigs = await ctx.service.systemConfig.find({
                isPaging: '0'
            });

            if (!_.isEmpty(systemConfigs)) {

                // let isDev = process.env.NODE_ENV == 'development' ? true : false;
                let databackforder = isDev ? process.cwd() + '/databak/' : systemConfigs[0].databackForderPath;
                let mongoBinPath = systemConfigs[0].mongodbInstallPath;
                let dataPath = databackforder + ms;

                const parsedUri = muri(app.config.mongoose.client.url)
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

                    try {
                        child.execSync(cmdstr);
                        let output = fs.createWriteStream(databackforder + ms + '.zip');
                        let archive = archiver('zip');

                        output.on('close', async () => {
                            console.log(archive.pointer() + ' total bytes');

                            if (ctx.service.backUpData) {
                                // 操作记录入库
                                let optParams = {
                                    logs: "Data backup",
                                    path: dataPath,
                                    fileName: ms + '.zip'
                                }
                                await ctx.service.backUpData.create(optParams);
                            }

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
                        console.log('back up data success');
                    } catch (error) {
                        console.log('back up data error', error);
                    }

                }
            }

            // ctx.app.cache = res.data;
        },
    }
};