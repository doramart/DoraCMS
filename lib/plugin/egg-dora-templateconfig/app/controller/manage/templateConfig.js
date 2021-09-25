/*
 * @Author: doramart
 * @Date: 2019-09-23 14:44:21
 * @Last Modified by: doramart
 * @Last Modified time: 2020-05-14 12:40:43
 */
'use strict';

const _ = require('lodash');

const { siteFunc } = require('../../utils');
const sendToWormhole = require('stream-wormhole');
const awaitWriteStream = require('await-stream-ready').write;

const shortid = require('shortid');
const path = require('path');
const unzip = require('node-unzip-2');
const fs = require('fs');
const iconv = require('iconv-lite');
const url = require('url');

const templateConfigRule = (ctx) => {
  return {
    name: {
      type: 'string',
      required: true,
      min: 1,
      max: 12,
      message: ctx.__('validate_error_field', [
        ctx.__('label_tempconfig_name'),
      ]),
    },
    forder: {
      type: 'string',
      required: true,
      min: 1,
      max: 30,
      message: ctx.__('validate_error_field', [
        ctx.__('label_tempconfig_forder'),
      ]),
    },
    comments: {
      type: 'string',
      required: true,
      min: 2,
      max: 30,
      message: ctx.__('validate_error_field', [ctx.__('label_comments')]),
    },
  };
};

const TemplateConfigController = {
  async _getDefaultTempInfo(ctx, app) {
    const defaultTempData = app.cache.get(
      app.config.session_secret + '_default_temp'
    );
    if (!_.isEmpty(defaultTempData)) {
      return defaultTempData;
    }
    try {
      const defaultTemp = await ctx.service.contentTemplate.item(ctx, {
        query: {
          using: true,
        },
        populate: ['items'],
      });
      if (!_.isEmpty(defaultTemp)) {
        // 缓存1天
        ctx.helper.setMemoryCache(
          app.config.session_secret + '_default_temp',
          defaultTemp,
          1000 * 60 * 60 * 24
        );
        return defaultTemp;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async getMyTemplateList(ctx, app) {
    try {
      const temps = await ctx.service.contentTemplate.find(
        {
          isPaging: '0',
        },
        {
          populate: ['items'],
        }
      );
      ctx.helper.renderSuccess(ctx, {
        data: temps,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getTempItemForderList(ctx, app) {
    try {
      const defaultTemp = await this._getDefaultTempInfo(ctx, app);
      const filePath = ctx.helper.scanJustFolder(
        app.config.temp_view_forder + defaultTemp.alias
      );
      const newFilePath = _.filter(filePath, (file) => {
        return file.name.indexOf('stage') >= 0;
      });
      // 对返回结果做初步排序
      newFilePath.sort(function (a, b) {
        return a.type === 'folder' || b.type === 'folder';
      });
      ctx.helper.renderSuccess(ctx, {
        data: newFilePath,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async addTemplateItem(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      const formObj = {
        name: fields.name,
        forder: fields.forder,
        isDefault: fields.isDefault,
        comments: fields.comments,
      };

      ctx.validate(templateConfigRule(ctx), formObj);

      const newTemplateConfigItems = await ctx.service.templateItem.create(
        formObj
      );

      const defaultTemp = await this._getDefaultTempInfo(ctx, app);
      await ctx.service.contentTemplate.addItems(
        defaultTemp._id,
        newTemplateConfigItems._id
      );

      ctx.helper.renderSuccess(ctx, {
        data: {
          id: newTemplateConfigItems._id,
        },
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async delTemplateItem(ctx, app) {
    try {
      let errMsg = '';
      if (!checkCurrentId(ctx.query.ids)) {
        errMsg = ctx.__('validate_error_params');
      }
      if (errMsg) {
        throw new Error(errMsg);
      }

      const defaultTemp = await this._getDefaultTempInfo(ctx, app);
      await ctx.service.contentTemplate.removeItems(
        defaultTemp._id,
        ctx.query.ids
      );

      await ctx.service.templateItem.removes(ctx, ctx.query.ids);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getTempsFromShop(ctx, app) {
    const payload = ctx.query;

    try {
      const pluginList = await ctx.helper.reqJsonData(
        app.config.doracms_api + '/api/cmsTemplate/getList',
        payload
      );
      ctx.helper.renderSuccess(ctx, {
        data: pluginList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // 模板安装
  async installTemp(ctx, app) {
    const tempId = ctx.query.tempId;
    const installType = ctx.query.installType || 'create'; // create 全新安装   update 更新
    const singleUserToken = ctx.query.singleUserToken;
    let tempObj = {};
    try {
      if (tempId) {
        const templateInfo = await ctx.helper.reqJsonData(
          app.config.doracms_api + '/api/cmsTemplate/getOne',
          {
            id: tempId,
            singleUserToken,
            authUser: '1',
          }
        );

        if (!_.isEmpty(templateInfo)) {
          tempObj = templateInfo;
          if (_.isEmpty(tempObj)) {
            throw new Error(ctx.__('validate_error_params'));
          }
          const file_url = tempObj.filePath;
          const file_targetForlder = tempObj.alias;
          const DOWNLOAD_DIR =
            app.config.temp_view_forder + file_targetForlder.trim() + '/';
          const target_path =
            DOWNLOAD_DIR + url.parse(file_url).pathname.split('/').pop();
          if (fs.existsSync(DOWNLOAD_DIR)) {
            throw new Error('您已安装该模板');
          }

          // 文件下载
          await siteFunc.downloadTempFile(ctx, file_url, DOWNLOAD_DIR);

          // 文件解压
          const tempAlias = await siteFunc.extractfile(
            ctx,
            app,
            DOWNLOAD_DIR,
            target_path,
            tempObj,
            'create'
          );

          // 资源拷贝
          await siteFunc.copyThemeToStaticForder(
            ctx,
            app,
            tempAlias,
            DOWNLOAD_DIR
          );

          ctx.helper.renderSuccess(ctx);
        } else {
          throw new Error('install error');
        }
      } else {
        throw new Error(ctx.__('validate_error_params'));
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // 模板上传
  async uploadCMSTemplate(ctx, app) {
    const stream = await ctx.getFileStream();
    // 所有表单字段都能通过 `stream.fields` 获取到
    const filename = path.basename(stream.filename); // 文件名称
    const extname = path.extname(stream.filename).toLowerCase(); // 文件扩展名称
    // 组装参数 model
    const ms = filename + extname;
    const attachment = {};
    attachment.extname = extname || 'hello';
    attachment.filename = filename;

    const forderName = filename.split('.')[0];
    const target_path = app.config.temp_view_forder + forderName + '.zip';
    const DOWNLOAD_DIR = app.config.temp_view_forder + forderName + '/';

    const writeStream = fs.createWriteStream(target_path);
    // 文件处理，上传到云存储等等
    try {
      await awaitWriteStream(stream.pipe(writeStream));

      if (fs.existsSync(DOWNLOAD_DIR)) {
        await ctx.helper.deleteFolder(target_path);
        throw new Error('您已上传过该模板，请修改信息后再上传！');
      }

      const realType = ctx.helper.getFileMimeType(target_path);
      if (realType.fileType !== 'zip') {
        fs.unlinkSync(target_path);
        throw new Error('文件类型不正确');
      }

      const extractState = () => {
        return new Promise((resolve, reject) => {
          fs.mkdirSync(DOWNLOAD_DIR);
          // 下载完成后解压缩
          const _this = this;
          const extract = unzip.Extract({
            path: DOWNLOAD_DIR,
          });
          extract.on('error', function (err) {
            console.log(err);
            // 解压异常处理
            throw new Error(err);
          });
          extract.on('finish', async function () {
            console.log('解压完成!!');
            // 解压完成检查文件是否完整
            const checkResult = await ctx.helper.checkTempUnzipSuccess(
              forderName
            );
            if (checkResult === '1') {
              const targetForder = forderName;
              const tempForder = app.config.temp_view_forder + targetForder;

              if (targetForder) {
                const jsonPath = tempForder + '/tempconfig.json';
                fs.readFile(jsonPath, 'binary', async (error, data) => {
                  if (error) {
                    throw new Error('文件读取失败');
                  } else {
                    // 处理中文乱码问题
                    const buf = new Buffer(data, 'binary');
                    const newData = iconv.decode(buf, 'utf-8');

                    const tempInfoData = eval('(' + newData + ')')[0];
                    if (
                      tempInfoData &&
                      tempInfoData.name &&
                      tempInfoData.alias &&
                      tempInfoData.version &&
                      tempInfoData.author &&
                      tempInfoData.comment
                    ) {
                      try {
                        const validateTempInfo = ctx.helper.checkTempInfo(
                          tempInfoData,
                          targetForder
                        );
                        if (validateTempInfo !== 'success') {
                          await ctx.helper.deleteFolder(tempForder);
                          await ctx.helper.deleteFolder(tempForder + '.zip');
                          reject('extract faild: ' + validateTempInfo);
                        } else {
                          const oldTemp = await ctx.service.templateItem.item(
                            ctx,
                            {
                              query: {
                                $or: [
                                  {
                                    name: tempInfoData.name,
                                  },
                                  {
                                    alias: tempInfoData.alias,
                                  },
                                ],
                              },
                            }
                          );
                          if (!_.isEmpty(oldTemp)) {
                            throw new Error(
                              '模板名称或key已存在，请修改后重试！'
                            );
                          }
                          // 复制静态文件到公共目录
                          const temp_static_forder =
                            app.config.temp_static_forder;
                          const fromPath =
                            app.config.temp_view_forder +
                            targetForder +
                            '/dist/';
                          const assetsPath =
                            app.config.temp_view_forder +
                            targetForder +
                            '/assets/';
                          const targetPath = temp_static_forder + targetForder;
                          ctx.helper.copyForder(fromPath, targetPath);
                          const targetAssetPath = path.join(
                            app.config.baseDir,
                            `app/assets/${targetForder}`
                          );
                          ctx.helper.copyForder(assetsPath, targetAssetPath);

                          const tempItem = {};
                          tempItem.forder = '2-stage-default';
                          tempItem.name = '默认模板';
                          tempItem.isDefault = true;
                          const currentItem = await ctx.service.templateItem.create(
                            tempItem
                          );

                          const tempObj = {
                            name: tempInfoData.name,
                            alias: tempInfoData.alias,
                            version: tempInfoData.version,
                            sImg:
                              app.config.static.prefix +
                              '/themes/' +
                              targetForder +
                              '/screenshot-desktop.jpg',
                            author: tempInfoData.author,
                            comment: tempInfoData.comment,
                            items: [],
                          };

                          tempObj.using = false;
                          tempObj.items.push(currentItem._id);
                          await ctx.service.contentTemplate.create(tempObj);
                          await ctx.helper.deleteFolder(tempForder + '.zip');
                          resolve();
                        }
                      } catch (err) {
                        await ctx.helper.deleteFolder(tempForder);
                        await ctx.helper.deleteFolder(tempForder + '.zip');
                        reject(err);
                      }
                    } else {
                      await ctx.helper.deleteFolder(tempForder);
                      await ctx.helper.deleteFolder(tempForder + '.zip');
                      reject('请正确填写配置文件');
                    }
                  }
                });
              } else {
                reject(ctx.__('validate_error_params'));
              }
            } else {
              reject(ctx.__('validate_error_params'));
            }
          });
          fs.createReadStream(target_path).pipe(extract);
        });
      };

      await extractState();

      ctx.helper.renderSuccess(ctx, {
        data: {},
      });
    } catch (err) {
      // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
      await sendToWormhole(stream);
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // 模板启用
  async enableTemp(ctx, app) {
    const tempId = ctx.query.tempId;

    try {
      if (!tempId || !shortid.isValid(tempId)) {
        throw new Error(ctx.__('validate_error_params'));
      }
      // 重置所有模板
      await ctx.service.contentTemplate.updateMany(
        ctx,
        '',
        {
          using: false,
        },
        {
          using: true,
        }
      );
      await ctx.service.contentTemplate.update(ctx, tempId, {
        using: true,
      });

      // 更新缓存
      const defaultTemp = await ctx.service.contentTemplate.item(ctx, {
        query: {
          using: true,
        },
        populate: ['items'],
      });
      ctx.helper.setMemoryCache(
        app.config.session_secret + '_default_temp',
        defaultTemp,
        1000 * 60 * 60 * 24
      );

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // 模板卸载
  async uninstallTemp(ctx, app) {
    const tempId = ctx.query.tempId;
    try {
      let errMsg = '';
      if (!checkCurrentId(tempId)) {
        errMsg = ctx.__('validate_error_params');
      }
      if (errMsg) {
        throw new Error(errMsg);
      }

      const defaultTemp = await this._getDefaultTempInfo(ctx, app);
      if (defaultTemp._id === tempId) {
        throw new Error('can not delete using template');
      } else {
        const targetTemp = await ctx.service.contentTemplate.item(ctx, {
          query: {
            _id: tempId,
          },
        });
        // console.log('---targetTemp---', targetTemp);
        if (!_.isEmpty(targetTemp)) {
          await ctx.service.templateItem.removes(
            ctx,
            targetTemp.items.join(',')
          );
          await ctx.service.contentTemplate.removes(ctx, targetTemp._id);

          // 删除模板文件夹
          siteFunc.deleteThemeStaticForder(app, targetTemp.alias);
          ctx.helper.renderSuccess(ctx);
        } else {
          throw new Error(ctx.__('validate_error_params'));
        }
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // 模板升级
  async updateTemplate(ctx, app) {
    const tempId = ctx.query.localTempId;
    const singleUserToken = ctx.query.singleUserToken;

    try {
      let errMsg = '';
      if (!checkCurrentId(tempId)) {
        errMsg = ctx.__('validate_error_params');
      }
      if (errMsg) {
        throw new Error(errMsg);
      }

      const targetTemp = await ctx.service.contentTemplate.item(ctx, {
        query: {
          _id: tempId,
        },
      });
      // console.log('---targetTemp---', targetTemp);
      if (!_.isEmpty(targetTemp)) {
        const remoteTemplateInfo = await ctx.helper.reqJsonData(
          app.config.doracms_api + '/api/cmsTemplate/getOne',
          {
            alias: targetTemp.alias,
            singleUserToken,
            authUser: '1',
          }
        );

        if (_.isEmpty(remoteTemplateInfo)) {
          throw new Error(ctx.__('validate_error_params'));
        } else {
          ctx.query.tempId = remoteTemplateInfo._id;
          ctx.query.installType = 'update';
        }

        // 删除模板文件夹
        siteFunc.deleteThemeStaticForder(app, targetTemp.alias);

        const file_url = remoteTemplateInfo.filePath;
        const file_targetForlder = remoteTemplateInfo.alias;
        const DOWNLOAD_DIR =
          app.config.temp_view_forder + file_targetForlder.trim() + '/';
        const target_path =
          DOWNLOAD_DIR + url.parse(file_url).pathname.split('/').pop();

        // 文件下载
        await siteFunc.downloadTempFile(
          ctx,
          remoteTemplateInfo.filePath,
          DOWNLOAD_DIR
        );
        // 文件解压
        const tempAlias = await siteFunc.extractfile(
          ctx,
          app,
          DOWNLOAD_DIR,
          target_path,
          remoteTemplateInfo,
          'update'
        );
        // 资源拷贝
        await siteFunc.copyThemeToStaticForder(
          ctx,
          app,
          tempAlias,
          DOWNLOAD_DIR
        );
        ctx.helper.renderSuccess(ctx, {
          data: '',
        });
      } else {
        throw new Error(ctx.__('validate_error_params'));
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = TemplateConfigController;
