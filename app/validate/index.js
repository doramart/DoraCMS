/*
 * @Author: doramart
 * @Date: 2019-08-15 13:16:58
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 21:23:55
 */

'use strict';
const fs = require('fs');
const path = require('path');
const rulePath = path.resolve(__dirname, './');
fs.readdirSync(rulePath).forEach(function (name) {
  if (path.extname(name) !== '') {
    name = path.basename(name, '.js');
    if (name !== 'index') {
      const currentName = name + 'Rule';
      exports[currentName] = require(path.resolve(rulePath, name));
    }
  }
});
