/*
 * @Author: doramart
 * @Date: 2019-11-20 10:07:42
 * @Description local 本地，qn 七牛，oss 阿里云oss
 * @Last Modified by: doramart
 * @Last Modified time: 2025-08-30 19:27:01
 */
'use strict';
const qiniu = require('qiniu');
const OSS = require('ali-oss');
const _ = require('lodash');
const awaitWriteStream = require('await-stream-ready').write;
const sendToWormhole = require('stream-wormhole');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { uploadConfig: config, uploadFile: upload } = require('../../utils');

// 同步遍历文件
function eachFileSync(dir, findOneFile) {
  const stats = fs.statSync(dir);
  if (stats.isDirectory()) {
    fs.readdirSync(dir).forEach(file => {
      eachFileSync(path.join(dir, file), findOneFile);
    });
  } else {
    findOneFile(dir, stats);
  }
}

// 处理Ueditor上传保存路径
function setFullPath(dest) {
  const date = new Date();

  const map = {
    t: date.getTime(), // 时间戳
    m: date.getMonth() + 1, // 月份
    d: date.getDate(), // 日
    h: date.getHours(), // 时
    i: date.getMinutes(), // 分
    s: date.getSeconds(), // 秒
  };

  dest = dest.replace(/\{([ymdhis])+\}|\{time\}|\{rand:(\d+)\}/g, function (all, t, r) {
    let v = map[t];
    if (v !== undefined) {
      if (all.length > 1) {
        v = '0' + v;
        v = v.substr(v.length - 2);
      }
      return v;
    } else if (t === 'y') {
      return (date.getFullYear() + '').substr(6 - all.length);
    } else if (all === '{time}') {
      return map.t;
    } else if (r >= 0) {
      return Math.random().toString().substr(2, r);
    }
    return all;
  });

  return dest;
}

// 抓取网络图片
const catchImage = function (url) {
  const request = /^https:\/\//.test(url) ? https.request : http.request;
  const image = url.match(/^(:?https?\:)?\/\/[^#?]+/)[0];
  const originalname = image.substr(image.lastIndexOf('/') + 1);
  let contentType = '';
  let base64Data = '';
  return new Promise(resolve => {
    const req = request(url, res => {
      contentType = res.headers['content-type'];
      res.setEncoding('base64');
      res.on('data', chunk => {
        base64Data += chunk;
      });
      res.on('end', () =>
        resolve({
          contentType,
          base64Data,
          originalname,
        })
      );
    });

    req.on('error', () =>
      resolve({
        error: true,
      })
    );
    req.end();
  });
};

// 获取上传配置
// 🔥 重构优化：使用标准化查询格式
async function _getUploadInfoByType(ctx) {
  const uploadConfig = await ctx.service.uploadFile.find({ isPaging: '0' }, { filters: {} });

  let uploadInfo = {};
  if (!_.isEmpty(uploadConfig)) {
    uploadInfo = uploadConfig[0];
  } else {
    // 如果没有，则创建一个本地配置
    uploadInfo = await ctx.service.uploadFile.create({
      type: 'local',
      uploadPath: process.cwd() + '/app/public',
    });
  }
  return uploadInfo;
}

// 上传到七牛云存储
const uploadByQiniu = (dataType, readableStream, targetKey, uploadConfigInfo) => {
  return new Promise((resolve, reject) => {
    const config = new qiniu.conf.Config();
    const { qn_bucket, qn_accessKey, qn_secretKey, qn_zone, qn_endPoint } = uploadConfigInfo;
    // 空间对应的机房
    config.zone = qiniu.zone[qn_zone];
    config.useHttpsDomain = true;

    // 要上传的空间
    const bucket = qn_bucket;

    const accessKey = qn_accessKey;
    const secretKey = qn_secretKey;
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const options = {
      scope: bucket + ':' + targetKey,
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);

    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    if (dataType === 'stream') {
      formUploader.putStream(uploadToken, targetKey, readableStream, putExtra, function (respErr, respBody, respInfo) {
        if (respErr) {
          reject(respErr);
        }
        if (respInfo.statusCode === 200) {
          console.log(respBody);
          if (!_.isEmpty(respBody) && qn_endPoint) {
            resolve(`${qn_endPoint}/${respBody.key}`);
          } else {
            reject(new Error('Upload qiniu failed'));
          }
        } else {
          reject(new Error(respBody));
        }
      });
    } else if (dataType === 'realPath') {
      formUploader.putFile(uploadToken, targetKey, readableStream, putExtra, function (respErr, respBody, respInfo) {
        if (respErr) {
          reject(respErr);
        }
        if (respInfo.statusCode === 200) {
          console.log(respBody);
          if (!_.isEmpty(respBody) && qn_endPoint) {
            // TODO 本地不留存
            fs.unlinkSync(readableStream);
            resolve(`${qn_endPoint}/${respBody.key}`);
          } else {
            reject(new Error('Upload qiniu failed'));
          }
        } else {
          reject(new Error(respBody));
        }
      });
    }
  });
};

// 上传到阿里云oss
const uploadByAliOss = async (dataType, stream, targetKey, uploadConfigInfo) => {
  try {
    const { oss_bucket, oss_accessKey, oss_secretKey, oss_region } = uploadConfigInfo;
    const clientOss = new OSS({
      region: oss_region,
      bucket: oss_bucket,
      accessKeyId: oss_accessKey,
      accessKeySecret: oss_secretKey,
    });

    let result;
    if (dataType === 'stream') {
      result = await clientOss.putStream(targetKey, stream);
    } else if (dataType === 'realPath') {
      result = await clientOss.put(targetKey, stream);
      // TODO 本地不留存
      fs.unlinkSync(stream);
    }
    // console.log('--result--', result);
    let targetUrl = result.url;
    if (targetUrl.indexOf('http://') >= 0) {
      targetUrl = targetUrl.replace('http://', 'https://');
    }
    return targetUrl;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getUploadConfig = userUploadConfig => {
  const conf = Object.assign({}, config, userUploadConfig || {});
  const uploadType = {
    [conf.imageActionName]: 'image',
    [conf.scrawlActionName]: 'scrawl',
    [conf.catcherActionName]: 'catcher',
    [conf.videoActionName]: 'video',
    [conf.fileActionName]: 'file',
  };
  const listType = {
    [conf.imageManagerActionName]: 'image',
    [conf.fileManagerActionName]: 'file',
  };
  return {
    conf,
    uploadType,
    listType,
  };
};

const ensureAllowedLocalFile = (ctx, localImgPath, uploadOptions = {}) => {
  if (!localImgPath || typeof localImgPath !== 'string') {
    throw new Error(ctx.__('validation.errorParams'));
  }

  const resolvedPath = path.resolve(localImgPath);
  const publicRoot = path.resolve(process.cwd() + '/app/public');
  const configuredUploadRoot = uploadOptions.upload_path ? path.resolve(uploadOptions.upload_path) : publicRoot;
  const allowedRoots = [ publicRoot, configuredUploadRoot ];
  const isAllowed = allowedRoots.some(root => resolvedPath === root || resolvedPath.startsWith(root + path.sep));

  if (!isAllowed || !fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    throw new Error(ctx.__('validation.errorParams'));
  }

  return resolvedPath;
};
// 上传前获取文件基础信息
const getFileInfoByStream = (ctx, uploadOptions, stream) => {
  const { conf, uploadType } = getUploadConfig(uploadOptions);

  const fileParams = stream.fields;
  const askFileType = fileParams.action || 'uploadimage'; // 默认上传图片
  const fileIndex = fileParams.index || 0;
  if (Object.keys(uploadType).includes(askFileType)) {
    const actionName = uploadType[askFileType];
    const pathFormat = setFullPath(conf[actionName + 'PathFormat']).split('/');
    const newFileName = pathFormat.pop();
    let uploadForder = path.join('.', ...pathFormat);
    uploadForder = uploadForder.replace(/\\/g, '/');
    // 所有表单字段都能通过 `stream.fields` 获取到
    const fileName = path.basename(stream.filename); // 文件名称
    const extname = path.extname(stream.filename).toLowerCase(); // 文件扩展名称
    if (!extname) {
      throw new Error(ctx.__('validation.errorParams'));
    }

    return {
      uploadForder,
      uploadFileName: newFileName + extname,
      fileName,
      fileType: extname,
      fileIndex,
    };
  }
  throw new Error(ctx.__('validation.errorParams'));
};

const getFileInfoByRealPath = (ctx, uploadOptions, fileInfo) => {
  const { conf, uploadType } = getUploadConfig(uploadOptions);

  const askFileType = 'uploadimage'; // 默认上传图片

  if (Object.keys(uploadType).includes(askFileType)) {
    const actionName = uploadType[askFileType];
    const pathFormat = setFullPath(conf[actionName + 'PathFormat']).split('/');
    const newFileName = pathFormat.pop();

    const uploadForder = path.join('.', ...pathFormat);
    // 所有表单字段都能通过 `stream.fields` 获取到
    const fileName = path.basename(fileInfo.filename); // 文件名称
    const extname = path.extname(fileInfo.filename).toLowerCase(); // 文件扩展名称
    if (!extname) {
      throw new Error(ctx.__('validation.errorParams'));
    }

    return {
      uploadForder,
      uploadFileName: newFileName + extname,
      fileName,
      fileType: extname,
    };
  }
  throw new Error(ctx.__('validation.errorParams'));
};

const UploadFileController = {
  /**
   * 创建上传文件
   * 🔥 重构优化：移除try-catch，使用统一异常处理中间件
   * @param ctx
   */
  async create(ctx) {
    // 存放路径
    const options = !_.isEmpty(this.app.config.doraUploadFile.uploadFileFormat)
      ? this.app.config.doraUploadFile.uploadFileFormat
      : {};
    const dataType = 'stream';
    let uploadPath, returnPath;
    const uploadConfigInfo = await _getUploadInfoByType(ctx);
    const stream = await ctx.getFileStream();

    const beforeUploadFileInfo = await getFileInfoByStream(ctx, options, stream);
    const { uploadForder, uploadFileName, fileIndex } = beforeUploadFileInfo;

    if (uploadConfigInfo.type === 'local') {
      const publicDir = options.upload_path || process.cwd() + '/app/public';
      uploadPath = `${publicDir}/${uploadForder}`;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      const target = path.join(uploadPath, `${uploadFileName}`);
      const writeStream = fs.createWriteStream(target);
      try {
        await awaitWriteStream(stream.pipe(writeStream));
      } catch (err) {
        // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
        await sendToWormhole(stream);
        throw err;
      }
      returnPath = `${this.app.config.static.prefix}/${uploadForder}/${uploadFileName}`;
    } else if (uploadConfigInfo.type === 'qn') {
      const currentUploadForder = options.static_root_path
        ? `${options.static_root_path}/${uploadForder}`
        : uploadForder;
      const targetKey = path.join(currentUploadForder, `${uploadFileName}`);
      returnPath = await uploadByQiniu(dataType, stream, targetKey, uploadConfigInfo);
    } else if (uploadConfigInfo.type === 'oss') {
      const currentUploadForder = options.static_root_path
        ? `${options.static_root_path}/${uploadForder}`
        : uploadForder;
      const targetKey = path.join(currentUploadForder, `${uploadFileName}`);
      returnPath = await uploadByAliOss(dataType, stream, targetKey, uploadConfigInfo);
    }

    // 设置响应内容和响应状态码
    ctx.helper.renderSuccess(ctx, {
      data: {
        path: returnPath,
        index: fileIndex,
      },
    });
  },

  /**
   * ueditor 上传
   * 🔥 重构优化：保持ueditor复杂逻辑，只移除外层try-catch
   * @param ctx
   * @param app
   * @param next
   */
  async ueditor(ctx, app, next) {
    const dataType = 'stream';
    const options = !_.isEmpty(this.app.config.doraUploadFile.uploadFileFormat)
      ? this.app.config.doraUploadFile.uploadFileFormat
      : {};
    const uploadConfigInfo = await _getUploadInfoByType(ctx);
    const publicDir = options.upload_path || process.cwd() + '/app/public';
    const publicUrlDir = this.app.config.static.prefix;

    const { conf, uploadType, listType } = getUploadConfig(options);

    let result = {};
    let { action, start = 0 } = ctx.query;
    start = parseInt(start);

    let resInfo = {};
    // 上传文件
    if (Object.keys(uploadType).includes(action)) {
      const actionName = uploadType[action];
      const pathFormat = setFullPath(conf[actionName + 'PathFormat']).split('/');
      let filename = pathFormat.pop();
      try {
        switch (action) {
          // 涂鸦类型图片
          case conf.scrawlActionName: {
            const base64Data = ctx.request.body[conf[actionName + 'FieldName']];
            const base64Length = base64Data.length;
            if (base64Length - (base64Length / 8) * 2 > conf[actionName + 'MaxSize']) {
              throw new Error('Picture too big');
            }
            ctx.req.file = upload.base64Image(base64Data, publicDir, {
              destination: path.join(publicDir, ...pathFormat),
            });

            resInfo = upload.fileFormat(ctx.req.file);
            resInfo.url = ctx.protocol + '://' + ctx.host + publicUrlDir + resInfo.url;
            result = Object.assign(
              {
                state: 'SUCCESS',
              },
              resInfo
            );
            break;
          }
          // 抓取远程图片
          case conf.catcherActionName: {
            const sources = ctx.request.body[conf[actionName + 'FieldName']];
            const list = [];
            const images = [];
            sources.forEach(url => {
              images.push(
                catchImage(url).then(image => {
                  if (image.error) {
                    list.push({
                      state: 'ERROR',
                      source: url,
                    });
                  } else {
                    let base64Data = image.base64Data;
                    const base64Length = base64Data.length;
                    if (base64Length - (base64Length / 8) * 2 > conf[actionName + 'MaxSize']) {
                      list.push({
                        state: 'Picture too big',
                        source: url,
                      });
                    } else {
                      // 重新获取filename
                      filename = setFullPath(conf[actionName + 'PathFormat'])
                        .split('/')
                        .pop();
                      if (filename === '{filename}') {
                        filename = image.originalname.replace(/\.\w+$/, '');
                      }
                      if (/^image\/(\w+)$/.test(image.contentType)) {
                        base64Data = 'data:' + image.contentType + ';base64,' + base64Data;
                      }
                      resInfo = upload.fileFormat(
                        upload.base64Image(base64Data, publicDir, {
                          destination: path.join(publicDir, ...pathFormat),
                          filename,
                        })
                      );
                      resInfo.url = ctx.protocol + '://' + ctx.host + publicUrlDir + resInfo.url;
                      list.push(
                        Object.assign(
                          {
                            state: 'SUCCESS',
                            source: url,
                          },
                          resInfo,
                          {
                            original: image.originalname,
                          }
                        )
                      );
                    }
                  }
                  return image;
                })
              );
            });

            await Promise.all(images);
            result = {
              state: 'SUCCESS',
              list,
            };
            break;
          }
          // 表单上传图片、文件
          default: {
            if (uploadConfigInfo.type === 'oss') {
              const fileStream = await ctx.getFileStream();
              const beforeUploadFileInfo = await getFileInfoByStream(ctx, options, fileStream);

              const { uploadForder, uploadFileName } = beforeUploadFileInfo;
              const currentUploadForder = options.static_root_path
                ? `${options.static_root_path}/${uploadForder}`
                : uploadForder;
              const targetKey = path.join(currentUploadForder, `${uploadFileName}`);
              beforeUploadFileInfo.url = await uploadByAliOss(dataType, fileStream, targetKey, uploadConfigInfo);
              result = Object.assign(
                {
                  state: 'SUCCESS',
                },
                beforeUploadFileInfo
              );
            } else if (uploadConfigInfo.type === 'qn') {
              const fileStream = await ctx.getFileStream();
              const beforeUploadFileInfo = await getFileInfoByStream(ctx, options, fileStream);

              const { uploadForder, uploadFileName } = beforeUploadFileInfo;
              const currentUploadForder = options.static_root_path
                ? `${options.static_root_path}/${uploadForder}`
                : uploadForder;
              const targetKey = path.join(currentUploadForder, `${uploadFileName}`);
              beforeUploadFileInfo.url = await uploadByQiniu(dataType, fileStream, targetKey, uploadConfigInfo);
              result = Object.assign(
                {
                  state: 'SUCCESS',
                },
                beforeUploadFileInfo
              );
            } else {
              await upload(
                publicDir,
                {
                  storage: upload.diskStorage({
                    destination: path.join(publicDir, ...pathFormat),
                    filename(req, file, cb) {
                      if (filename === '{filename}') {
                        filename = file.originalname;
                      } else {
                        filename += upload.getSuffix(file.originalname);
                      }
                      cb(null, filename);
                    },
                  }),
                  limits: {
                    fileSize: conf[actionName + 'MaxSize'],
                  },
                  allowfiles: conf[actionName + 'AllowFiles'],
                },
                options || {}
              ).single(conf[actionName + 'FieldName'])(ctx, next);
              resInfo = upload.fileFormat(ctx.req.file);
              resInfo.url = publicUrlDir + resInfo.url;
              result = Object.assign(
                {
                  state: 'SUCCESS',
                },
                resInfo
              );
            }
          }
        }
      } catch (err) {
        result = {
          state: err.message,
        };
      }
    } else if (Object.keys(listType).includes(action)) {
      const actionName = listType[action];
      const files = [];
      eachFileSync(path.join(publicDir, conf[actionName + 'ManagerListPath']), (file, stat) => {
        if (conf[actionName + 'ManagerAllowFiles'].includes(upload.getSuffix(file))) {
          const url = file.replace(publicDir, '').replace(/\\/g, '/');
          const mtime = stat.mtimeMs;
          files.push({
            url,
            mtime,
          });
        }
      });
      result = {
        list: files.slice(start, start + conf[actionName + 'ManagerListSize']),
        start,
        total: files.length,
        state: 'SUCCESS',
      };
    } else if (action === 'config') {
      result = conf;
    } else {
      result = {
        state: 'FAIL',
      };
    }

    ctx.body = JSON.stringify(result);
  },

  /**
   * 通过已知文件路径上传
   * 🔥 重构优化：移除try-catch，使用统一异常处理中间件
   * @param ctx
   */
  async createFileByPath(ctx) {
    // 存放路径
    const options = !_.isEmpty(this.app.config.doraUploadFile.uploadFileFormat)
      ? this.app.config.doraUploadFile.uploadFileFormat
      : {};
    const fields = ctx.request.body || {};
    const imgPath = fields.imgPath;
    const localImgPath = ensureAllowedLocalFile(ctx, fields.localImgPath, options);
    const fileDataType = 'realPath';

    let returnPath;
    const uploadConfigInfo = await _getUploadInfoByType(ctx);
    const beforeUploadFileInfo = await getFileInfoByRealPath(ctx, options, fields);

    const { uploadForder, uploadFileName } = beforeUploadFileInfo;

    if (uploadConfigInfo.type === 'local') {
      returnPath = imgPath;
    } else if (uploadConfigInfo.type === 'qn') {
      const currentUploadForder = options.static_root_path
        ? `${options.static_root_path}/${uploadForder}`
        : uploadForder;
      const targetKey = path.join(currentUploadForder, `${uploadFileName}`);
      returnPath = await uploadByQiniu(fileDataType, localImgPath, targetKey, uploadConfigInfo);
    } else if (uploadConfigInfo.type === 'oss') {
      const currentUploadForder = options.static_root_path
        ? `${options.static_root_path}/${uploadForder}`
        : uploadForder;
      const targetKey = path.join(currentUploadForder, `${uploadFileName}`);
      returnPath = await uploadByAliOss(fileDataType, localImgPath, targetKey, uploadConfigInfo);
    }

    // 设置响应内容和响应状态码
    ctx.helper.renderSuccess(ctx, {
      data: {
        path: returnPath,
      },
    });
  },
};

module.exports = UploadFileController;
