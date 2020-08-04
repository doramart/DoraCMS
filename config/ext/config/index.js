const fs = require('fs');
const path = require('path');
var rulePath = path.resolve(__dirname, './');
fs.readdirSync(rulePath).forEach(function (name) {
    if (path.extname(name) !== '') {
        name = path.basename(name, '.js');
        if (name != 'index') {
            let currentName = name + 'Router';
            exports[currentName] = require(path.resolve(rulePath, name));
        }
    }
});