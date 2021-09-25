/*
 * @Author: doramart
 * @Date: 2019-09-23 14:44:21
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 23:11:56
 */
'use strict';
const _ = require('lodash');

const { siteFunc } = require('../../utils');
const fs = require('fs');

const ContentTemplateController = {
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const contentTemplateList = await ctx.service.contentTemplate.find(
        payload,
        {
          populate: ['items'],
        }
      );

      ctx.helper.renderSuccess(ctx, {
        data: contentTemplateList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx, app) {
    try {
      const _id = ctx.query.id;

      const targetUser = await ctx.service.contentTemplate.item(ctx, {
        query: {
          _id,
        },
      });

      ctx.helper.renderSuccess(ctx, {
        data: targetUser,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async removes(ctx, app) {
    try {
      const targetIds = ctx.query.ids;
      await ctx.service.contentTemplate.removes(ctx, targetIds);
      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  _setTempData(ctx, app, targetTemp) {
    let tempTree = [];
    // tempTree.push({
    //     id: 'i18n',
    //     parentId: 0,
    //     name: ctx.__("label_tempconfig_tree_i18n"),
    //     open: false
    // });
    tempTree.push({
      id: 'public',
      parentId: 0,
      name: ctx.__('label_tempconfig_tree_common_temp'),
      open: false,
    });
    // tempTree.push({
    //     id: 'users',
    //     parentId: 0,
    //     name: ctx.__("label_tempconfig_tree_users_temp"),
    //     open: true
    // });
    tempTree.push({
      id: 'styles',
      parentId: 0,
      name: ctx.__('label_tempconfig_tree_styles_temp'),
      open: true,
    });
    tempTree.push({
      id: 'js',
      parentId: 0,
      name: ctx.__('label_tempconfig_tree_script_temp'),
      open: true,
    });

    // 读取ejs模板
    let newPubPath = siteFunc.setTempParentId(
      ctx.helper.scanFolder(
        app.config.temp_view_forder,
        targetTemp + '/public'
      ),
      'public'
    );
    // let newUserPath = siteFunc.setTempParentId(ctx.helper.scanFolder(app.config.temp_view_forder, targetTemp + "/users"), 'users');
    // newPubPath = newPubPath.concat(newUserPath);
    // 读取国际化
    // let newI18nPath = siteFunc.setTempParentId(ctx.helper.scanFolder(app.config.temp_locales_forder), 'i18n');
    // newPubPath = newPubPath.concat(newI18nPath);
    const temp_static_forder = app.config.temp_static_forder;
    // 读取静态文件
    if (fs.existsSync(temp_static_forder + targetTemp)) {
      const newStylePath = siteFunc.setTempParentId(
        ctx.helper.scanFolder(temp_static_forder, targetTemp + '/css'),
        'styles'
      );
      const newJsPath = siteFunc.setTempParentId(
        ctx.helper.scanFolder(temp_static_forder, targetTemp + '/js'),
        'js'
      );
      newPubPath = newPubPath.concat(newStylePath).concat(newJsPath);
    }
    // 读取模板单元
    const filePath = ctx.helper.scanJustFolder(
      app.config.temp_view_forder + targetTemp
    );
    let tempUnit = [];
    tempUnit.push({
      id: 'tempUnit',
      parentId: 0,
      name: ctx.__('label_tempconfig_tree_script_tempUnit'),
      open: true,
    });
    for (let i = 0; i < filePath.length; i++) {
      const fileObj = filePath[i];
      if (fileObj.name.split('-')[1] === 'stage') {
        tempUnit.push({
          id: fileObj.name,
          parentId: 'tempUnit',
          name: fileObj.name,
          open: true,
        });
        const unitArr = ctx.helper.scanFolder(
          app.config.temp_view_forder,
          targetTemp + '/' + fileObj.name
        );
        const newUnitArr = siteFunc.setTempParentId(unitArr, fileObj.name);
        tempUnit = tempUnit.concat(newUnitArr);
      }
    }
    if (tempUnit.length > 0) {
      newPubPath = newPubPath.concat(tempUnit);
    }

    // 读取根目录下的所有文件
    const rootArr = ctx.helper.scanFolder(
      app.config.temp_view_forder,
      targetTemp
    );
    const newRootArr = [];
    for (let j = 0; j < rootArr.length; j++) {
      const rootObj = rootArr[j];

      if (rootObj.type === 'html') {
        const rootFile = siteFunc.setTempParentId(rootObj, 0);
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
  },

  async getContentDefaultTemplate(ctx, app) {
    try {
      const defaultTemp = await ctx.service.contentTemplate.item(ctx, {
        query: {
          using: true,
        },
        populate: ['items'],
      });

      const tempTree = this._setTempData(ctx, app, defaultTemp.alias);
      ctx.helper.renderSuccess(ctx, {
        data: {
          docs: tempTree,
        },
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getFileInfo(ctx, app) {
    try {
      const filePath = ctx.query.filePath;
      if (filePath && filePath.split('./').length > 1) {
        throw new Error('no power');
      } else {
        const path =
          siteFunc.getTempBaseFile(
            filePath,
            app.config.temp_view_forder,
            app.config.temp_static_forder
          ) + filePath;
        if (path) {
          const fileData = await ctx.helper.readFile(path);
          ctx.helper.renderSuccess(ctx, {
            data: {
              doc: fileData,
              path: filePath,
            },
          });
        } else {
          throw new Error('no power');
        }
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async updateFileInfo(ctx, app) {
    const fields = ctx.request.body || {};
    const fileContent = fields.code;
    const filePath = fields.path;

    try {
      if (!fileContent || !filePath) {
        throw new Error(ctx.__('validate_error_params'));
      }
      if (filePath && filePath.split('./').length > 1) {
        throw new Error(ctx.__('validate_error_params'));
      } else {
        const path =
          siteFunc.getTempBaseFile(
            filePath,
            app.config.temp_view_forder,
            app.config.temp_static_forder
          ) + filePath;
        if (path) {
          const writeState = ctx.helper.writeFile(path, fileContent);
          if (writeState === 200) {
            // 清除模板缓存
            app.nunjucks.cleanCache(path);
            ctx.helper.renderSuccess(ctx);
          } else {
            throw new Error('no path file');
          }
        } else {
          throw new Error('no power');
        }
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async createInvoice(ctx, app) {
    try {
      const targetId = ctx.request.body.tempId;
      const singleUserToken = ctx.request.body.singleUserToken;

      if (!targetId || !singleUserToken) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const invoiceData = {
        singleUserToken,
        itemId: targetId,
        type: '1',
      };
      const hostUrl = ctx.request.header.host;
      if (
        hostUrl &&
        hostUrl.indexOf('localhost') < 0 &&
        hostUrl.indexOf('127.0.0.1') < 0
      ) {
        invoiceData.siteDomain = hostUrl;
      }
      const askCreateInvoiceUrl = `${app.config.doracms_api}/api/alipaySystem/createInvoice`;
      const createInvoiceResult = await ctx.helper.reqJsonData(
        askCreateInvoiceUrl,
        invoiceData,
        'post'
      );

      ctx.helper.renderSuccess(ctx, {
        data: createInvoiceResult,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async checkInvoice(ctx, app) {
    try {
      const noInvoice = ctx.request.body.noInvoice;
      const singleUserToken = ctx.request.body.singleUserToken;

      if (!noInvoice) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const checkInviceState = await ctx.helper.reqJsonData(
        app.config.doracms_api + '/api/alipaySystem/checkInvoice',
        {
          noInvoice,
          singleUserToken,
        },
        'post'
      );

      ctx.helper.renderSuccess(ctx, {
        data: checkInviceState,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = ContentTemplateController;
