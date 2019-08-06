/*
 * @Author: doramart 
 * @Date: 2019-07-16 10:26:45 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-16 10:33:51
 */

const fs = require('fs');
const path = require('path');
var modelsPath = path.resolve(__dirname, './');
fs.readdirSync(modelsPath).forEach(function (name) {
    if (path.extname(name) !== '') {
        name = path.basename(name, '.js');
        if (name != 'index') {
            let currentName = name + 'Service';
            exports[currentName] = require(path.resolve(modelsPath, name));
        }
    }
});


//DoraServiceEnd