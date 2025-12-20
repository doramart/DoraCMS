'use strict';
const fs = require('fs');
const path = require('path');
const rulePath = path.resolve(__dirname, './');
fs.readdirSync(rulePath).forEach(function (name) {
  if (path.extname(name) !== '') {
    name = path.basename(name, '.js');
    if (name !== 'index') {
      const currentName = name + 'Router';
      exports[currentName] = require(path.resolve(rulePath, name));
    }
  }
});
