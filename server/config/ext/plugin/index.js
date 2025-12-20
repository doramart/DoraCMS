'use strict';
const fs = require('fs');
const path = require('path');
const rulePath = path.resolve(__dirname, './');
fs.readdirSync(rulePath).forEach(function (name) {
  if (path.extname(name) !== '') {
    name = path.basename(name, '.js');
    if (name !== 'index') {
      const currentName = 'dora' + name.substr(0, 1).toUpperCase() + name.substr(1, name.length);
      exports[currentName] = require(path.resolve(rulePath, name));
    }
  }
});
