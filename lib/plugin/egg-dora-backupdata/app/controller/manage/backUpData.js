'use strict';
const moment = require('moment');
const isDev = process.env.NODE_ENV === 'development';
const fs = require('fs');
const _ = require('lodash');
const child = require('child_process');
const archiver = require('archiver');
const muri = require('muri');
const BackUpDataController = {
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const backUpDataList = await ctx.service.backUpData.find(payload);

      ctx.helper.renderSuccess(ctx, {
        data: backUpDataList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async backUpData(ctx, app) {
    const ms = moment(new Date()).format('YYYYMMDDHHmmss').toString();

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
        // 操作记录入库
        const optParams = {
          logs: 'Data backup',
          path: dataPath,
          fileName: ms,
        };
        await ctx.service.backUpData.create(optParams);
        ctx.helper.renderSuccess(ctx);
      } catch (error) {
        ctx.helper.renderFail(ctx, {
          message: error,
        });
      }
    }
  },

  // 数据恢复
  async restoreData(ctx, app) {
    try {
      const files = ctx.request.body || {};
      if (!files.id) {
        throw new Error(ctx.__('validate_error_params'));
      }
      const targetDataInfo = await ctx.service.backUpData.item(ctx, {
        query: {
          _id: files.id,
        },
      });
      if (_.isEmpty(targetDataInfo)) {
        throw new Error(ctx.__('validate_error_params'));
      }
      const localDataPath = targetDataInfo.path;

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

      if (!fs.existsSync(`${localDataPath}/${parsedUri.db}`)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const cmdstr = `${
        app.config.mongodb.binPath
      }mongorestore ${parameters.join(' ')} --drop ${localDataPath}/${
        parsedUri.db
      }`;

      child.execSync(cmdstr);

      // 操作记录入库
      const optParams = {
        logs: 'Data restore',
        path: `${localDataPath}/${parsedUri.db}`,
      };

      await ctx.service.backUpData.create(optParams);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async removes(ctx, app) {
    try {
      const targetIds = ctx.query.ids;

      const currentItem = await ctx.service.backUpData.item(ctx, {
        query: {
          _id: targetIds,
        },
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
        message: err,
      });
    }
  },
};

module.exports = BackUpDataController;
