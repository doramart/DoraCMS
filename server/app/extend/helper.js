/*
 * @Author: doramart
 * @Date: 2019-08-15 14:23:19
 * @Last Modified by: doramart
 * @Last Modified time: 2026-01-24 23:31:08
 */
'use strict';
require('module-alias/register');

// 文件操作对象
const fs = require('fs');
// const path = require('path');
const stat = fs.stat;
// TODO 老版本暂时保留，下个版本移除
const CryptoJS = require('crypto-js');
// 站点配置
const validator = require('validator');
const iconv = require('iconv-lite');
const Axios = require('axios');
const _ = require('lodash');
const { contextManager } = require('./helper/tags/context');
module.exports = {
  // 更新app全局上下文
  updateAppGlobalContext(app, params = {}) {
    if (!params.type || !params.data) {
      return;
    }
    if (params.type === 'site') {
      const oldSite = contextManager._site;
      const newSite = { ...oldSite, ...params.data };
      contextManager.setSite(newSite);
    } else if (params.type === 'config') {
      const oldConfig = contextManager._config;
      const newConfig = { ...oldConfig, ...params.data };
      contextManager.setConfig(newConfig);
    } else if (params.type === 'custom') {
      const oldCustom = contextManager._custom;
      const newCustom = { ...oldCustom, ...params.data };
      contextManager.setCustom(newCustom);
    } else if (params.type === 'member') {
      const oldMember = contextManager._member;
      const newMember = { ...oldMember, ...params.data };
      contextManager.setMember(newMember);
    }
    app.messenger.sendToApp('context-updated');
  },

  async reqJsonData(url, params = {}, method = 'get') {
    let responseData;

    let targetUrl = '';

    if (url.indexOf('manage/') === 0) {
      targetUrl = this.app.server_path + '/' + url;
    } else if (url.indexOf('http') === 0) {
      targetUrl = url;
    } else {
      targetUrl = this.app.server_path + '/api/' + url;
    }

    if (method === 'get') {
      responseData = await Axios.get(targetUrl, {
        params,
      });
    } else if (method === 'post') {
      responseData = await Axios.post(targetUrl, params);
    }

    if (
      responseData &&
      responseData.status === 200 &&
      !_.isEmpty(responseData.data) &&
      responseData.data.status === 200
    ) {
      return responseData.data.data;
    }
    throw new Error(responseData.data.message);
  },

  clearRedisByType(str, cacheKey) {
    console.log('cacheStr', str);
    const currentKey = this.app.config.session_secret + cacheKey + str;
    this.setMemoryCache(currentKey, '', 2000);
  },

  /**
   * 成功响应（使用新的统一响应格式）
   * @param ctx
   * @param root0
   * @param root0.data
   * @param root0.message
   * @deprecated 建议使用 APIResponse.success() 替代
   */
  renderSuccess(ctx, { data = {}, message = '' } = {}) {
    const APIResponse = require('../utils/apiResponse');
    APIResponse.success(ctx, { data, message });
  },

  /**
   * 失败响应（使用新的统一响应格式）
   * @param ctx
   * @param root0
   * @param root0.message
   * @param root0.data
   * @param root0.code
   * @deprecated 建议使用 APIResponse.fail() 或其他具体方法替代
   */
  renderFail(ctx, { message = '', data = {}, code = 500 } = {}) {
    const APIResponse = require('../utils/apiResponse');

    if (message) {
      // 如果 message 是 Error 对象，提取消息
      if (message instanceof Error) {
        message = message.message;
      }

      // 根据状态码选择合适的响应方法
      if (code === 401) {
        APIResponse.unauthorized(ctx, message);
      } else if (code === 403) {
        APIResponse.forbidden(ctx, message);
      } else if (code === 404) {
        APIResponse.notFound(ctx, message);
      } else if (code === 400) {
        APIResponse.badRequest(ctx, message, data);
      } else if (code === 422) {
        APIResponse.businessError(ctx, message);
      } else if (code === 429) {
        APIResponse.tooManyRequests(ctx, message);
      } else {
        APIResponse.fail(ctx, { message, data, status: code });
      }
    } else {
      throw new Error('Error message is required');
    }
  },

  scanFolder(basePath, path) {
    // 文件夹列表读取
    // 记录原始路径
    const oldPath = path;
    const filesList = [];

    const fileList = [],
      folderList = [],
      walk = function (path, fileList, folderList) {
        const files = fs.readdirSync(basePath + path);
        files.forEach(function (item) {
          const tmpPath = basePath + path + '/' + item,
            relativePath = path + '/' + item,
            stats = fs.statSync(tmpPath);
          let typeKey = 'folder';
          if (oldPath === path) {
            if (stats.isDirectory()) {
              walk(relativePath, fileList, folderList);
            } else {
              const fileType = item.split('.')[1];

              if (fileType) {
                const ltype = fileType.toLowerCase();
                if (
                  ltype.indexOf('jpg') >= 0 ||
                  ltype.indexOf('gif') >= 0 ||
                  ltype.indexOf('png') >= 0 ||
                  ltype.indexOf('pdf') >= 0
                ) {
                  typeKey = 'image';
                } else if (ltype.indexOf('htm') >= 0) {
                  typeKey = 'html';
                } else if (ltype.indexOf('js') === 0) {
                  typeKey = 'js';
                } else if (ltype.indexOf('ejs') === 0) {
                  typeKey = 'ejs';
                } else if (ltype.indexOf('css') >= 0) {
                  typeKey = 'css';
                } else if (ltype.indexOf('txt') >= 0) {
                  typeKey = 'txt';
                } else if (ltype.indexOf('mp4') >= 0 || ltype.indexOf('mp3') >= 0) {
                  typeKey = 'video';
                } else {
                  typeKey = 'others';
                }
              }
            }

            const fileInfo = {
              name: item,
              type: typeKey,
              path: relativePath,
              size: stats.size,
              date: stats.mtime,
            };
            // 隐藏文件不显示
            item.split('.')[0] && filesList.push(fileInfo);
          }
        });
      };

    walk(path, fileList, folderList);
    //        console.log('扫描' + path +'成功----'+ filesList.join());

    return filesList;
  },
  scanJustFolder(path) {
    // 只读取文件夹，不做递归
    const folderList = [];

    const files = fs.readdirSync(path);
    files.forEach(function (item) {
      const tmpPath = path + '/' + item,
        stats = fs.statSync(tmpPath);
      if (stats.isDirectory()) {
        const fileInfo = {
          name: item,
          type: 'folder',
          size: stats.size,
          date: stats.mtime,
        };
        folderList.push(fileInfo);
      }
    });

    return folderList;
  },

  deleteFolder(path) {
    // console.log("---del path--" + path);
    return new Promise(resolve => {
      let files = [];
      if (fs.existsSync(path)) {
        // console.log("---begin to del--");
        if (fs.statSync(path).isDirectory()) {
          const walk = function (path) {
            files = fs.readdirSync(path);
            files.forEach(function (file) {
              const curPath = path + '/' + file;
              if (fs.statSync(curPath).isDirectory()) {
                // recurse
                walk(curPath);
              } else {
                // delete file
                fs.unlinkSync(curPath);
              }
            });
            fs.rmdirSync(path);
          };
          walk(path);
          // console.log("---del folder success----");
          resolve();
        } else {
          fs.unlink(path, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log('del file success');
              resolve();
            }
          });
        }
      } else {
        resolve();
      }
    });
  },
  reNameFile(path, newPath) {
    if (fs.existsSync(path)) {
      fs.rename(path, newPath, function (err) {
        if (err) {
          console.log('重命名失败！');
          this.ctx.end('error');
        } else {
          console.log('重命名成功！');
          this.ctx.end('success');
        }
      });
    }
  },
  readFile(path) {
    // 文件读取
    return new Promise((resolve, reject) => {
      if (fs.existsSync(path)) {
        fs.readFile(path, 'binary', function (error, data) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            // 处理中文乱码问题
            const buf = new Buffer(data, 'binary');
            const newData = iconv.decode(buf, 'utf-8');
            resolve(newData);
          }
        });
      } else {
        reject(this.ctx.__('validation.errorParams'));
      }
    });
  },
  writeFile(path, content) {
    if (fs.existsSync(path)) {
      // 写入文件
      const newContent = iconv.encode(content, 'utf-8');
      fs.writeFileSync(path, newContent);
      return 200;
    }
    return 500;
  },

  // 文件夹复制
  copyForder(fromPath, toPath) {
    /*
     * 复制目录中的所有文件包括子目录
     * @param{ String } 需要复制的目录
     * @param{ String } 复制到指定的目录
     */
    // 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
    const exists = function (src, dst, callback) {
      fs.existsSync(dst, function (exists) {
        // 已存在
        if (exists) {
          callback(src, dst);
        } else {
          fs.mkdir(dst, function () {
            callback(src, dst);
          });
        }
      });
    };

    const copy = function (src, dst) {
      // 读取目录中的所有文件/目录
      fs.readdir(src, function (err, paths) {
        if (err) {
          throw err;
        }

        paths.forEach(function (path) {
          const _src = src + '/' + path,
            _dst = dst + '/' + path;
          let readable, writable;
          stat(_src, function (err, st) {
            if (err) {
              throw err;
            }
            // 判断是否为文件
            if (st.isFile()) {
              // 创建读取流
              readable = fs.createReadStream(_src);
              // 创建写入流
              writable = fs.createWriteStream(_dst);
              // 通过管道来传输流
              readable.pipe(writable);
            } else if (st.isDirectory()) {
              exists(_src, _dst, copy);
            }
          });
        });
      });
    };

    // 复制目录
    exists(fromPath, toPath, copy);
  },

  // 获取文件真实类型
  getFileMimeType(filePath) {
    const buffer = new Buffer(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    const newBuf = buffer.slice(0, 4);
    const head_1 = newBuf[0].toString(16);
    const head_2 = newBuf[1].toString(16);
    const head_3 = newBuf[2].toString(16);
    const head_4 = newBuf[3].toString(16);
    const typeCode = head_1 + head_2 + head_3 + head_4;
    let filetype = '';
    let mimetype;
    switch (typeCode) {
      case 'ffd8ffe1':
        filetype = 'jpg';
        mimetype = ['image/jpeg', 'image/pjpeg'];
        break;
      case 'ffd8ffe0':
        filetype = 'jpg';
        mimetype = ['image/jpeg', 'image/pjpeg'];
        break;
      case 'ffd8ffdb':
        filetype = 'jpg';
        mimetype = ['image/jpeg', 'image/pjpeg'];
        break;
      case '47494638':
        filetype = 'gif';
        mimetype = 'image/gif';
        break;
      case '89504e47':
        filetype = 'png';
        mimetype = ['image/png', 'image/x-png'];
        break;
      case '504b34':
        filetype = 'zip';
        mimetype = ['application/x-zip', 'application/zip', 'application/x-zip-compressed'];
        break;
      case '2f2aae5':
        filetype = 'js';
        mimetype = 'application/x-javascript';
        break;
      case '2f2ae585':
        filetype = 'css';
        mimetype = 'text/css';
        break;
      case '5b7bda':
        filetype = 'json';
        mimetype = ['application/json', 'text/json'];
        break;
      case '3c212d2d':
        filetype = 'ejs';
        mimetype = 'text/html';
        break;
      default:
        filetype = 'unknown';
        break;
    }

    fs.closeSync(fd);

    return {
      fileType: filetype,
      mimeType: mimetype,
    };
  },

  checkTempUnzipSuccess(targetForder) {
    return new Promise(resolve => {
      const system_template_forder = this.app.config.temp_view_forder;
      const tempForder = system_template_forder + targetForder;
      const DOWNLOAD_DIR = system_template_forder + targetForder + '/tempconfig.json';
      const DIST_DIR = system_template_forder + targetForder + '/dist';
      const PUBLIC_DIR = system_template_forder + targetForder + '/public';
      const DEFAULT_DIR = system_template_forder + targetForder + '/index.html';

      let checkTempCount = 0;
      const tempTask = setInterval(async () => {
        if (
          fs.existsSync(DOWNLOAD_DIR) &&
          fs.existsSync(DIST_DIR) &&
          fs.existsSync(PUBLIC_DIR) &&
          fs.existsSync(DEFAULT_DIR)
        ) {
          clearInterval(tempTask);
          resolve('1');
        } else {
          checkTempCount = checkTempCount + 1;
          // 请求超时，文件不完整
          if (checkTempCount > 10) {
            await this.deleteFolder(tempForder);
            await this.deleteFolder(tempForder + '.zip');
            clearInterval(tempTask);
            resolve('0');
          }
        }
      }, 3000);
    });
  },

  checkTempInfo(tempInfoData, forderName) {
    const name = tempInfoData.name;
    const alias = tempInfoData.alias;
    const version = tempInfoData.version;
    const author = tempInfoData.author;
    const comment = tempInfoData.comment;
    let errors;

    if (forderName !== alias) {
      errors = '模板名称跟文件夹名称不统一';
    }

    if (!validator.isLength(name, 4, 15)) {
      errors = '模板名称必须为4-15个字符';
    }

    const enReg = new RegExp('^[a-zA-Z]+$');
    if (!enReg.test(alias)) {
      errors = '模板关键字必须为英文字符';
    }

    if (!validator.isLength(alias, 4, 15)) {
      errors = '模板关键字必须为4-15个字符';
    }

    if (!validator.isLength(version, 2, 15)) {
      errors = '版本号必须为2-15个字符';
    }

    if (!validator.isLength(author, 2, 15)) {
      errors = '作者名称必须为2-15个字符';
    }

    if (!validator.isLength(comment, 4, 40)) {
      errors = '模板描述必须为4-30个字符';
    }

    if (errors) {
      return errors;
    }
    return 'success';
  },

  encrypt(data, key) {
    // 密码加密

    return CryptoJS.AES.encrypt(data, key).toString();
  },

  decrypt(data, key) {
    // 密码解密
    const bytes = CryptoJS.AES.decrypt(data, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  },

  getKeyArrByTokenId(tokenId) {
    tokenId = decodeURIComponent(tokenId);
    const newLink = this.decrypt(tokenId, this.app.config.encrypt_key);
    const keyArr = newLink.split('$');
    return keyArr;
  },

  async getAdminPower(ctx) {
    const adminId = ctx?.session?.adminUserInfo?.id;
    const defaultResult = { apis: [], routePaths: [], permissions: [], permissionCodes: [] };
    if (!adminId) {
      return defaultResult;
    }

    const cacheTTL = ctx.app.config.permission?.cacheTTL || 5 * 60 * 1000;
    const cacheKey = `admin_power_${adminId}`;
    if (cacheTTL > 0) {
      const unifiedCache = ctx.app.cache;
      if (unifiedCache?.get) {
        const cachedPower = await unifiedCache.get(cacheKey);
        if (cachedPower) {
          return cachedPower;
        }
      }
    }

    const adminUserInfo = await ctx.service.admin.findOne(
      {
        id: adminId,
      },
      {
        populate: [
          {
            path: 'userRoles',
            select: 'menus buttons id status roleName',
          },
        ],
        fields: ['userRoles'],
      }
    );

    if (!adminUserInfo || !adminUserInfo.userRoles) {
      return defaultResult;
    }

    // 收集菜单ID和按钮代码（使用Set去重）
    const menuIds = new Set();
    const rolePermissionCodes = new Set();

    adminUserInfo.userRoles.forEach(role => {
      if (role.status === '1') {
        // 收集菜单ID
        if (role.menus && Array.isArray(role.menus)) {
          role.menus.forEach(menuId => menuIds.add(menuId));
        }
        // 收集按钮权限标识
        if (role.buttons && Array.isArray(role.buttons)) {
          role.buttons.forEach(code => rolePermissionCodes.add(code));
        }
      }
    });

    const strictBindingEnabled = ctx.app.config.permission?.strictMenuBinding !== false;

    if (menuIds.size === 0) {
      return defaultResult;
    }

    const [menuButtonApis, menuRoutes, menuButtons] = await Promise.all([
      ctx.service.menu.getButtonApis(Array.from(menuIds)),
      ctx.service.menu.getMenuRoutePaths(Array.from(menuIds)),
      ctx.service.menu.getMenuButtonsWithPermissionCodes(Array.from(menuIds)),
    ]);
    const menuButtonList = Array.isArray(menuButtons)
      ? menuButtons.map(btn => ({
          ...btn,
          permissionCode: btn.permissionCode,
          httpMethod: btn.httpMethod ? btn.httpMethod.toUpperCase() : 'POST',
        }))
      : [];

    const buttonMatchesRole = button => {
      if (!rolePermissionCodes || rolePermissionCodes.size === 0) {
        return false;
      }
      if (button.permissionCode && rolePermissionCodes.has(button.permissionCode)) {
        return true;
      }
      return false;
    };

    const apiMethodMap = new Map();
    menuButtonList.forEach(btn => {
      if (btn.api) {
        apiMethodMap.set(btn.api, btn.httpMethod || 'POST');
      }
    });

    let allowedApis = [];
    if (rolePermissionCodes.size > 0) {
      allowedApis = menuButtonList
        .filter(btn => buttonMatchesRole(btn))
        .map(btn => ({
          api: btn.api,
          method: btn.httpMethod || 'POST',
        }))
        .filter(item => item.api);
    } else if (!strictBindingEnabled) {
      allowedApis = menuButtonApis
        .map(api => {
          const method = apiMethodMap.get(api);
          return method ? { api, method } : { api };
        })
        .filter(item => item.api);
    }

    const permissionRegistry = ctx.app.permissionRegistry;
    const permissionCodes = new Set();
    const candidateButtons =
      rolePermissionCodes.size > 0
        ? menuButtonList.filter(btn => buttonMatchesRole(btn))
        : !strictBindingEnabled
          ? menuButtonList
          : [];

    if (permissionRegistry) {
      candidateButtons.forEach(btn => {
        const definition =
          permissionRegistry.getByCode(btn.permissionCode) || permissionRegistry.getByLegacyApi(btn.api);
        if (definition) {
          permissionCodes.add(definition.code);
        }
      });

      rolePermissionCodes.forEach(code => {
        if (permissionCodes.has(code)) {
          return;
        }
        const definition = permissionRegistry.getByCode(code);
        if (definition) {
          permissionCodes.add(definition.code);
        }
      });
    }

    if (permissionRegistry && permissionCodes.size === 0 && allowedApis.length > 0) {
      allowedApis.forEach(item => {
        const api = typeof item === 'string' ? item : item?.api;
        const definition = permissionRegistry.getByLegacyApi(api);
        if (definition) {
          permissionCodes.add(definition.code);
        }
      });
    }

    const menuRoutePaths = new Set();
    if (!strictBindingEnabled) {
      menuRoutes.forEach(menu => {
        if (!menu.hasButtons && menu.routePath) {
          const routePath = menu.routePath.startsWith('/') ? menu.routePath.slice(1) : menu.routePath;
          menuRoutePaths.add(routePath);
        }
      });
    }

    const result = {
      apis: allowedApis,
      routePaths: Array.from(menuRoutePaths),
      permissions:
        permissionRegistry && permissionCodes.size > 0
          ? Array.from(permissionCodes)
              .map(code => permissionRegistry.getByCode(code))
              .filter(Boolean)
          : [],
      permissionCodes: Array.from(permissionCodes),
    };

    if (cacheTTL > 0) {
      ctx.helper.setMemoryCache(cacheKey, result, cacheTTL);
    }

    return result;
  },

  _extractDocsFromResult(result) {
    if (!result) {
      return [];
    }
    if (Array.isArray(result)) {
      return result;
    }
    if (Array.isArray(result.docs)) {
      return result.docs;
    }
    if (Array.isArray(result.data)) {
      return result.data;
    }
    if (Array.isArray(result.list)) {
      return result.list;
    }
    if (Array.isArray(result.rows)) {
      return result.rows;
    }
    if (Array.isArray(result.items)) {
      return result.items;
    }
    return [];
  },

  async invalidateAdminPowerCacheByAdminIds(ctx, adminIds = []) {
    if (!Array.isArray(adminIds) || adminIds.length === 0) {
      return;
    }
    const uniqueIds = [...new Set(adminIds.filter(Boolean))];
    uniqueIds.forEach(adminId => {
      const cacheKey = `admin_power_${adminId}`;
      this.setMemoryCache(cacheKey, null);
    });
  },

  async invalidateAdminPowerCacheByRoleIds(ctx, roleIds = []) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return;
    }
    const uniqueRoleIds = [...new Set(roleIds.filter(Boolean))];
    if (uniqueRoleIds.length === 0) {
      return;
    }

    try {
      const adminResult = await ctx.service.admin.findByRoles(
        uniqueRoleIds,
        { isPaging: '0', pageSize: 0, lean: '1' },
        { fields: ['id'] }
      );
      const adminDocs = this._extractDocsFromResult(adminResult);
      const adminIds = adminDocs.map(item => item.id || item._id).filter(Boolean);
      await this.invalidateAdminPowerCacheByAdminIds(ctx, adminIds);
    } catch (error) {
      ctx.logger.warn('[helper.invalidateAdminPowerCacheByRoleIds] %s', error.message);
    }
  },

  async invalidateAllAdminPowerCache(ctx) {
    try {
      const adminResult = await ctx.service.admin.find({ isPaging: '0', pageSize: 0, lean: '1' }, { fields: ['id'] });
      const adminDocs = this._extractDocsFromResult(adminResult);
      const adminIds = adminDocs.map(item => item.id || item._id).filter(Boolean);
      await this.invalidateAdminPowerCacheByAdminIds(ctx, adminIds);
    } catch (error) {
      ctx.logger.warn('[helper.invalidateAllAdminPowerCache] %s', error.message);
    }
  },

  setMemoryCache(key, value, time) {
    if (value) {
      this.app.messenger.sendToApp('refreshCache', {
        key,
        value,
        time,
      });
    } else {
      this.app.messenger.sendToApp('clearCache', {
        key,
      });
    }
  },

  assignLocals(ctx, key, value) {
    ctx.locals[key] = value;
  },

  //   发送消息给客户端
  async sendMessageToClient(ctx, subkey = 'message', messages = '') {
    // const adminUsers = await ctx.service.admin.find(
    //   { isPaging: '0' },
    //   {
    //     query: {
    //       state: '1',
    //     },
    //     files: 'id userName',
    //   }
    // );
    // for (const userItem of adminUsers) {
    //   if (!_.isEmpty(userItem)) {
    //     const socket_key = `${this.app.config.socket_prefix}:${userItem.id}`;
    //     const socketId = this.app.cache.get(socket_key);
    //     if (socketId) {
    //       const namespace = this.app.io.of('/');
    //       namespace.sockets[socketId].emit('message', {
    //         plugin: subkey,
    //         msg: messages,
    //       });
    //     }
    //   }
    // }
  },

  // ==================== Repository 标准化参数转换工具 ====================

  /**
   * Repository 参数转换工具集
   * 用于将旧的参数格式转换为新的标准化格式
   */
  repositoryParamConverter: {
    /**
     * 转换排序格式为标准格式
     * @param {Object} sortObj 旧的排序对象 { field: 1/-1 } 或 { field: 'asc'/'desc' }
     * @return {Array} 标准排序数组 [{ field: 'fieldName', order: 'asc'/'desc' }]
     * @example
     * // 输入: { updatedAt: -1, title: 1 }
     * // 输出: [{ field: 'updatedAt', order: 'desc' }, { field: 'title', order: 'asc' }]
     */
    convertSortToStandard(sortObj) {
      if (!sortObj || typeof sortObj !== 'object') {
        return [{ field: 'updatedAt', order: 'desc' }];
      }

      return Object.entries(sortObj).map(([field, order]) => ({
        field,
        order: order === 1 || order === 'asc' ? 'asc' : 'desc',
      }));
    },

    /**
     * 转换字段格式为标准格式
     * @param {String|Array} fields 字段配置
     * @return {Array|undefined} 标准字段数组
     * @example
     * // 输入: 'name email createdAt'
     * // 输出: ['name', 'email', 'createdAt']
     * // 输入: ['name', 'email']
     * // 输出: ['name', 'email']
     */
    convertFieldsToStandard(fields) {
      if (typeof fields === 'string') {
        return fields.split(' ').filter(Boolean);
      }
      if (Array.isArray(fields)) {
        return fields;
      }
      return undefined;
    },

    /**
     * 转换查询条件为标准过滤格式
     * @param {Object} query 旧的查询对象
     * @return {Object} 标准过滤对象
     * @example
     * // 输入: { state: '2', category: { $in: ['tech'] } }
     * // 输出: { state: { $eq: '2' }, category: { $in: ['tech'] } }
     */
    convertQueryToFilters(query) {
      if (!query || typeof query !== 'object') {
        return {};
      }

      const filters = {};
      for (const [key, value] of Object.entries(query)) {
        if (typeof value === 'object' && value !== null) {
          // 保持复杂查询条件不变（如 $in, $regex 等）
          filters[key] = value;
        } else {
          // 简单值转换为 $eq 操作符
          filters[key] = { $eq: value };
        }
      }
      return filters;
    },

    /**
     * 转换分页参数为标准格式
     * @param {Object} payload 分页参数对象
     * @return {Object} 标准分页对象
     * @example
     * // 输入: { current: 2, pageSize: 20, isPaging: '1' }
     * // 输出: { page: 2, pageSize: 20, isPaging: true }
     */
    convertPaginationToStandard(payload = {}) {
      return {
        page: payload.current || payload.page || 1,
        pageSize: payload.pageSize || payload.limit || 10,
        isPaging: payload.isPaging !== false && payload.isPaging !== '0',
      };
    },

    /**
     * 转换 populate 参数为标准格式
     * @param {String|Array|Object} populate populate 配置
     * @return {Array} 标准 populate 数组
     * @example
     * // 输入: 'author category'
     * // 输出: [{ path: 'author' }, { path: 'category' }]
     * // 输入: [{ path: 'author', select: 'name' }]
     * // 输出: [{ path: 'author', select: ['name'] }]
     */
    convertPopulateToStandard(populate) {
      if (!populate) {
        return [];
      }

      // 字符串格式：'author category tags'
      if (typeof populate === 'string') {
        return populate
          .split(' ')
          .filter(Boolean)
          .map(path => ({ path }));
      }

      // 数组格式
      if (Array.isArray(populate)) {
        return populate
          .map(item => {
            if (typeof item === 'string') {
              return { path: item };
            }
            if (typeof item === 'object' && item.path) {
              return {
                path: item.path,
                select: this.convertFieldsToStandard(item.select) || [],
                filters: item.filters || {},
                populate: this.convertPopulateToStandard(item.populate) || [],
                sort: this.convertSortToStandard(item.sort) || {},
                limit: item.limit || 0,
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      // 对象格式
      if (typeof populate === 'object') {
        return [populate];
      }

      return [];
    },

    /**
     * 一键转换所有参数为标准格式
     * @param {Object} payload 分页等参数
     * @param {Object} options 查询选项（query, sort, files, populate）
     * @return {Object} 标准化后的参数对象
     * @example
     * const standardParams = ctx.helper.repositoryParamConverter.convertAllToStandard(
     *   { current: 1, pageSize: 10 },
     *   {
     *     query: { state: '2' },
     *     sort: { updatedAt: -1 },
     *     files: 'title content author',
     *     populate: 'author category'
     *   }
     * );
     */
    convertAllToStandard(payload = {}, options = {}) {
      return {
        // 分页参数
        ...this.convertPaginationToStandard(payload),

        // 查询选项
        filters: this.convertQueryToFilters(options.query || options.filters || {}),
        sort: this.convertSortToStandard(options.sort || {}),
        fields: this.convertFieldsToStandard(options.files || options.fields),
        populate: this.convertPopulateToStandard(options.populate || []),
      };
    },
  },
};
