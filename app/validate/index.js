/*
 * @Author: doramart 
 * @Date: 2019-08-15 13:16:58 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-09-26 16:15:49
 */



const fs = require('fs');
const path = require('path');
var rulePath = path.resolve(__dirname, './');
fs.readdirSync(rulePath).forEach(function (name) {
    if (path.extname(name) !== '') {
        name = path.basename(name, '.js');
        if (name != 'index') {
            let currentName = name + 'Rule';
            exports[currentName] = require(path.resolve(rulePath, name));
        }
    }
});