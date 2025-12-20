/*
 * @Author: doramart
 * @Date: 2019-08-15 13:16:58
 * @Last Modified by: doramart
 * @Last Modified time: 2025-08-10 00:05:46
 */

'use strict';
const fs = require('fs');
const path = require('path');
const rulePath = path.resolve(__dirname, './');
fs.readdirSync(rulePath).forEach(function (name) {
  if (path.extname(name) === '.js') {
    name = path.basename(name, '.js');
    if (name !== 'index') {
      const currentName = name + 'Rule';
      exports[currentName] = require(path.resolve(rulePath, name));
    }
  }
});
