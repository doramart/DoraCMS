const fs = require('fs');
const path = require('path');
var rulePath = path.resolve(__dirname, './');
fs.readdirSync(rulePath).forEach(function (name) {
    if (path.extname(name) !== '') {
        name = path.basename(name, '.js');
        if (name != 'index') {
            let currentName = 'dora' + (name.substr(0, 1)).toUpperCase() + name.substr(1, name.length);
            exports[currentName] = require(path.resolve(rulePath, name));
        }
    }
});