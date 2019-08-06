/*
 * @Author: doramart 
 * @Date: 2019-07-16 09:28:19 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-16 10:34:02
 */


const fs = require('fs');
const path = require('path');
var modelsPath = path.resolve(__dirname, './');
fs.readdirSync(modelsPath).forEach(function (name) {
    if (path.extname(name) !== '') {
        name = path.basename(name, '.js');
        if (name != 'index') {
            let currentName = name.substr(0, 1).toUpperCase() + name.slice(1) + 'Controller';
            exports[currentName] = require(path.resolve(modelsPath, name));
        }
    }
});