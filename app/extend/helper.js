/*
 * @Author: doramart
 * @Date: 2019-08-15 14:23:19
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-18 18:09:06
 */
'use strict';
require('module-alias/register');

// 文件操作对象
const fs = require('fs');
const path = require('path');
const stat = fs.stat;
// TODO 老版本暂时保留，下个版本移除
const CryptoJS = require('crypto-js');
// 站点配置
const validator = require('validator');
const iconv = require('iconv-lite');
const Axios = require('axios');
const _ = require('lodash');

module.exports = {
  async reqJsonData(url, params = {}, method = 'get') {
    let responseData;

    let targetUrl = '';

    if (url.indexOf('manage/') === 0) {
      targetUrl = this.app.config.server_path + '/' + url;
    } else if (url.indexOf('http') === 0) {
      targetUrl = url;
    } else {
      targetUrl = this.app.config.server_api + '/' + url;
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

  renderSuccess(ctx, { data = {}, message = '' } = {}) {
    ctx.body = {
      status: 200,
      data: data || {},
      message: message || '',
    };
    ctx.status = 200;
  },

  renderFail(ctx, { message = '', data = {} } = {}) {
    if (message) {
      // throw new Error(message);
      if (message instanceof Object) {
        message = message.message;
      }
      ctx.body = {
        status: 500,
        message,
        data: data || {},
      };
      ctx.status = 200;
    } else {
      throw new Error(message);
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
                } else if (
                  ltype.indexOf('mp4') >= 0 ||
                  ltype.indexOf('mp3') >= 0
                ) {
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
    return new Promise((resolve, reject) => {
      let files = [];
      if (fs.existsSync(path)) {
        // console.log("---begin to del--");
        if (fs.statSync(path).isDirectory()) {
          const walk = function (path) {
            files = fs.readdirSync(path);
            files.forEach(function (file, index) {
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
        reject(this.ctx.__('validate_error_params'));
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
        mimetype = [
          'application/x-zip',
          'application/zip',
          'application/x-zip-compressed',
        ];
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
    return new Promise((resolve, reject) => {
      const system_template_forder = this.app.config.temp_view_forder;
      const tempForder = system_template_forder + targetForder;
      const DOWNLOAD_DIR =
        system_template_forder + targetForder + '/tempconfig.json';
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
    const adminUserInfo = await ctx.service.adminUser.item(ctx, {
      query: {
        _id: ctx.session.adminUserInfo._id,
      },
      populate: [
        {
          path: 'group',
          select: 'power _id enable name',
        },
      ],
      files: 'group',
    });
    const adminPower = adminUserInfo.group.power || {};
    return adminPower;
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
    const adminUsers = await ctx.service.adminUser.find(
      { isPaging: '0' },
      {
        query: {
          state: '1',
        },
        files: 'id userName',
      }
    );
    for (const userItem of adminUsers) {
      if (!_.isEmpty(userItem)) {
        const socket_key = `${this.app.config.socket_prefix}:${userItem.id}`;
        const socketId = this.app.cache.get(socket_key);
        if (socketId) {
          const namespace = this.app.io.of('/');
          namespace.sockets[socketId].emit('message', {
            plugin: subkey,
            msg: messages,
          });
        }
      }
    }
  },
};
