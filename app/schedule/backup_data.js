'use strict';
const moment = require('moment');
const fs = require('fs');
const _ = require('lodash');
const child = require('child_process');
const archiver = require('archiver');
const muri = require('muri');

module.exports = (app) => {
  return {
    schedule: {
      cron: app.config.backUpTick,
      type: 'all', // 指定所有的 worker 都需要执行
    },
    async task(ctx) {
      const date = new Date();
      const ms = moment(date).format('YYYYMMDDHHmmss').toString();

      const databackforder = app.config.mongodb.backUpPath;

      const dataPath = databackforder + ms;

      const parsedUri = muri(app.config.mongoose.client.url);
      const parameters = [];
      if (parsedUri.auth) {
        parameters.push(
          `-u "${parsedUri.auth.user}"`,
          `-p "${parsedUri.auth.pass}"`
        );
      }
      if (parsedUri.db) {
        parameters.push(`-d "${parsedUri.db}"`);
      }
      const cmdstr = `${app.config.mongodb.binPath}mongodump ${parameters.join(
        ' '
      )} -o "${dataPath}"`;

      if (!fs.existsSync(databackforder)) {
        fs.mkdirSync(databackforder);
      }
      if (fs.existsSync(dataPath)) {
        console.log('已经创建过备份了');
      } else {
        fs.mkdirSync(dataPath);

        try {
          child.execSync(cmdstr);
          const output = fs.createWriteStream(databackforder + ms + '.zip');
          const archive = archiver('zip');

          output.on('close', async () => {
            console.log(archive.pointer() + ' total bytes');

            if (ctx.service.backUpData) {
              // 操作记录入库
              const optParams = {
                logs: 'Data backup',
                path: dataPath,
                fileName: ms + '.zip',
              };
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

      // ctx.app.cache = res.data;
    },
  };
};
