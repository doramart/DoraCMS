/*
 * @Author: doramart
 * @Date: 2021-03-26 16:19:49
 * @Last Modified by: doramart
 * @Last Modified time: 2025-04-24 23:06:56
 */

'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('@koa/multer');

// 默认静态目录
let publicDir = '';

// 同步创建文件目录
function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  }
  if (mkdirsSync(path.dirname(dirname))) {
    fs.mkdirSync(dirname);
    return true;
  }
}

// 获取文件后缀
function getSuffix(filename) {
  return filename.substr(filename.lastIndexOf('.')).toLowerCase();
}

// 默认存储方式
const diskStorage = multer.diskStorage({
  // 文件保存路径
  destination(req, file, cb) {
    let dir = '';
    let type = 'file';
    file.mimetype.replace(/image|video/g, v => {
      return (type = v);
    });
    dir = path.join(publicDir, 'upload', type);
    mkdirsSync(dir);
    cb(null, dir);
  },
  // 修改文件名称，时间戳+6位随机数
  filename(req, file, cb) {
    cb(null, Date.now() + Math.random().toString().substr(2, 6) + getSuffix(file.originalname));
  },
});

// 处理上传后返回的数据格式
function fileFormat(data) {
  let { originalname: original, filename: title, path: url, size } = data;
  const type = getSuffix(title);
  url = url.replace(publicDir, '').replace(/\\/g, '/');
  return { original, title, type, url, size };
}

// 上传文件
function upload(dir, options = {}) {
  if (typeof dir === 'object') {
    options = dir;
    dir = '';
  }

  publicDir = path.resolve(dir || 'public');

  const allowfiles = options.allowfiles || '*'; // 文件类型，['.jpg', '.png']

  const fileFilter = (req, file, cb) => {
    if (allowfiles === '*' || allowfiles.includes(getSuffix(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  };

  return multer(
    Object.assign(
      {
        storage: diskStorage,
        fileFilter,
        limits: {
          files: 20, // 单次上传文件最大数量
          fileSize: 2 * 1024 * 1024, // 文件最大长度 (字节单位)
        },
      },
      options
    )
  );
}

// 保存base64类型图片
function base64Image(base64Data, dir, options) {
  if (typeof dir === 'object') {
    options = dir;
    dir = '';
  }

  publicDir = path.resolve(dir || 'public');

  let dest = '';
  let ext = '.png';
  let { destination, filename } = Object.assign(
    {
      destination: path.join(publicDir, 'upload', 'image'),
      filename: Date.now() + Math.random().toString().substr(2, 6),
    },
    options || {}
  );

  base64Data = base64Data.replace(/^data:image\/(\w+);base64,/, (all, e) => {
    ext = e === 'jpeg' ? '.jpg' : '.' + e;
    return '';
  });
  filename += ext;
  dest = path.join(destination, filename);

  mkdirsSync(destination);
  fs.writeFileSync(dest, base64Data, 'base64');
  const stat = fs.statSync(dest);
  return { originalname: '', filename, path: dest, size: stat.size };
}

exports = module.exports = upload;
exports.mkdirsSync = mkdirsSync;
exports.getSuffix = getSuffix;
exports.fileFormat = fileFormat;
exports.base64Image = base64Image;
exports.diskStorage = multer.diskStorage;
